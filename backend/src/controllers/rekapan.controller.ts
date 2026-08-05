import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  CreateRekapanOutgoingSchema,
  UpdateRekapanOutgoingSchema,
  RekapanOutgoingIdSchema,
} from '../schemas/rekapan.schema';
import { createError, logError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Helper function to calculate total
 */
const calculateTotal = (ongkir: number, asuransi: number, packing: number): number => {
  return ongkir + asuransi + packing;
};

const roundToThree = (n: number) => {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
};

const parseLocalDate = (value: string, endOfDay = false): Date => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${value}`);
  }
  const date = new Date(year, month - 1, day);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const formatDateTimeString = (date: Date): string => {
  const pad = (n: number, length = 2) => String(n).padStart(length, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}`;
};

/**
 * Create new rekapan outgoing
 */
export const createRekapanOutgoing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const validatedData = CreateRekapanOutgoingSchema.parse(req.body);

    // sanitize numeric fields to avoid float precision issues
    const sanitized = {
      ...validatedData,
      jumlahKoli: Math.round(validatedData.jumlahKoli),
      beratKg: roundToThree(validatedData.beratKg),
      ongkir: Math.round(validatedData.ongkir),
      asuransi: Math.round(validatedData.asuransi),
      packing: Math.round(validatedData.packing),
    };

    // Calculate total
    const total = calculateTotal(sanitized.ongkir, sanitized.asuransi, sanitized.packing);

    // Create record
    const rekapan = await prisma.rekapanOutgoing.create({
      data: {
        ...sanitized,
        total,
      },
    });

    logError(`✓ Rekapan created successfully: ${rekapan.id}`, 'CREATE_SUCCESS');

    res.status(201).json({
      success: true,
      message: 'Rekapan berhasil dibuat',
      data: rekapan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'CREATE_REKAPAN');
    next(error);
  }
};

/**
 * Import multiple rekapan rows (batch). Validates all rows server-side and inserts atomically.
 * Payload: { rows: CreateRekapanOutgoingInput[] }
 */
export const importRekapan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      throw createError('Payload harus berisi array `rows`', 400);
    }

    const rowErrors: Array<{ rowIndex?: number | string; errors: string[] }> = [];
    const validData: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const parsed = CreateRekapanOutgoingSchema.parse(r);
        const sanitized = {
          ...parsed,
          jumlahKoli: Math.round(parsed.jumlahKoli),
          beratKg: roundToThree(parsed.beratKg),
          ongkir: Math.round(parsed.ongkir),
          asuransi: Math.round(parsed.asuransi),
          packing: Math.round(parsed.packing),
        };
        const total = sanitized.ongkir + sanitized.asuransi + sanitized.packing;
        validData.push({ ...sanitized, total });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          rowErrors.push({ rowIndex: r.rowIndex ?? i + 1, errors: err.errors.map((e) => e.message) });
        } else {
          rowErrors.push({ rowIndex: r.rowIndex ?? i + 1, errors: [String(err)] });
        }
      }
    }

    if (rowErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: rowErrors });
    }

    // Insert in a single createMany operation
    await prisma.rekapanOutgoing.createMany({ data: validData });

    res.status(201).json({ success: true, message: `${validData.length} baris berhasil diimpor` });
  } catch (error) {
    logError(error, 'IMPORT_REKAPAN');
    next(error);
  }
};

/**
 * Get all rekapan outgoing with pagination and filters
 */
export const getAllRekapanOutgoing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate } = req.query;
      const { provinsi, metodePembayaran, sortBy, sortOrder } = req.query;

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;
    const all = String(req.query.all || '').toLowerCase() === 'true';

    // Build filter
    const where: any = {};

    if (search) {
      where.OR = [
        { waybill: { contains: search as string } },
        { provinsi: { contains: search as string } },
        { jenisBarang: { contains: search as string } },
      ];
    }

    if (provinsi) {
      where.provinsi = { equals: provinsi as string };
    }

    if (metodePembayaran) {
      where.metodePembayaran = metodePembayaran as any;
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        const sStr = String(startDate);
        where.tanggal.gte = /^\d{4}-\d{2}-\d{2}$/.test(sStr)
          ? parseLocalDate(sStr)
          : new Date(sStr);
      }
      if (endDate) {
        const eStr = String(endDate);
        where.tanggal.lte = /^\d{4}-\d{2}-\d{2}$/.test(eStr)
          ? parseLocalDate(eStr, true)
          : new Date(eStr);
      }
    }

    // Logging for debug
    // eslint-disable-next-line no-console
    console.debug('GET /rekapan params', { page: pageNum, limit: limitNum, all, search, startDate, endDate, provinsi, metodePembayaran, sortBy, sortOrder });
    // Execute queries
    let data: any[] = [];
    let total = 0;

    const orderBy = ((): any => {
      const sb = String(sortBy || 'tanggal');
      const so = String(sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
      const allowed = ['tanggal', 'ongkir', 'beratKg', 'total', 'jumlahKoli'];
      if (allowed.includes(sb)) {
        return { [sb]: so };
      }
      return { tanggal: 'desc' };
    })();

    if (all) {
      data = await prisma.rekapanOutgoing.findMany({ where, orderBy });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prisma.rekapanOutgoing.findMany({ where, skip, take: limitNum, orderBy }),
        prisma.rekapanOutgoing.count({ where }),
      ]);
    }

    // eslint-disable-next-line no-console
    console.debug('GET /rekapan result', { returned: data.length, total });

    res.status(200).json({
      success: true,
      message: 'Data rekapan berhasil diambil',
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'GET_ALL_REKAPAN');
    next(error);
  }
};

/**
 * Debug compare: return paginated vs all IDs for same query params
 */
export const compareRekapanResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // reuse query parsing from getAllRekapanOutgoing
    const { page = 1, limit = 10, search, startDate, endDate } = req.query;
    const { provinsi, metodePembayaran, sortBy, sortOrder } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { waybill: { contains: search as string } },
        { provinsi: { contains: search as string } },
        { jenisBarang: { contains: search as string } },
      ];
    }
    if (provinsi) where.provinsi = { equals: provinsi as string };
    if (metodePembayaran) where.metodePembayaran = metodePembayaran as any;
    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) where.tanggal.gte = new Date(startDate as string);
      if (endDate) {
        const eStr = endDate as string;
        const eDate = new Date(eStr);
        if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) eDate.setHours(23, 59, 59, 999);
        where.tanggal.lte = eDate;
      }
    }

    const orderBy = ((): any => {
      const sb = String(sortBy || 'tanggal');
      const so = String(sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
      const allowed = ['tanggal', 'ongkir', 'beratKg', 'total', 'jumlahKoli'];
      if (allowed.includes(sb)) return { [sb]: so };
      return { tanggal: 'desc' };
    })();

    const paginated = await prisma.rekapanOutgoing.findMany({ where, skip, take: limitNum, orderBy });
    const all = await prisma.rekapanOutgoing.findMany({ where, orderBy });

    const paginatedIds = paginated.map((r) => r.id);
    const allIds = all.map((r) => r.id);
    const missingInExport = paginatedIds.filter((id) => !allIds.includes(id));
    const missingInPaginated = allIds.filter((id) => !paginatedIds.includes(id));

    res.status(200).json({ success: true, data: { paginatedIds, allIds, missingInExport, missingInPaginated, paginatedCount: paginated.length, allCount: all.length } });
  } catch (err) {
    next(err);
  }
};

/**
 * Get rekapan outgoing by ID
 */
export const getRekapanOutgoingById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate ID format
    const validatedId = RekapanOutgoingIdSchema.parse({ id: req.params.id });

    // Find record
    const rekapan = await prisma.rekapanOutgoing.findUnique({
      where: { id: validatedId.id },
    });

    if (!rekapan) {
      throw createError('Rekapan tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Rekapan berhasil diambil',
      data: rekapan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'GET_REKAPAN_BY_ID');
    next(error);
  }
};

/**
 * Update rekapan outgoing
 */
export const updateRekapanOutgoing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate ID
    const validatedId = RekapanOutgoingIdSchema.parse({ id: req.params.id });

    // Validate data
    const validatedData = UpdateRekapanOutgoingSchema.parse(req.body);

    // Check if record exists
    const existing = await prisma.rekapanOutgoing.findUnique({
      where: { id: validatedId.id },
    });

    if (!existing) {
      throw createError('Rekapan tidak ditemukan', 404);
    }

    // Prepare update data
    const dataToUpdate: any = { ...validatedData };

    // sanitize numeric updates to avoid float precision issues
    if (dataToUpdate.jumlahKoli !== undefined) dataToUpdate.jumlahKoli = Math.round(dataToUpdate.jumlahKoli);
    if (dataToUpdate.beratKg !== undefined) dataToUpdate.beratKg = roundToThree(dataToUpdate.beratKg);
    if (dataToUpdate.ongkir !== undefined) dataToUpdate.ongkir = Math.round(dataToUpdate.ongkir);
    if (dataToUpdate.asuransi !== undefined) dataToUpdate.asuransi = Math.round(dataToUpdate.asuransi);
    if (dataToUpdate.packing !== undefined) dataToUpdate.packing = Math.round(dataToUpdate.packing);

    // Calculate new total if cost fields are updated
    if (
      validatedData.ongkir !== undefined ||
      validatedData.asuransi !== undefined ||
      validatedData.packing !== undefined
    ) {
      const ongkir = validatedData.ongkir ?? existing.ongkir;
      const asuransi = validatedData.asuransi ?? existing.asuransi;
      const packing = validatedData.packing ?? existing.packing;
      dataToUpdate.total = calculateTotal(ongkir, asuransi, packing);
    }

    // Update record
    const rekapan = await prisma.rekapanOutgoing.update({
      where: { id: validatedId.id },
      data: dataToUpdate,
    });

    logError(`✓ Rekapan updated successfully: ${rekapan.id}`, 'UPDATE_SUCCESS');

    res.status(200).json({
      success: true,
      message: 'Rekapan berhasil diperbarui',
      data: rekapan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'UPDATE_REKAPAN');
    next(error);
  }
};

/**
 * Delete rekapan outgoing
 */
export const deleteRekapanOutgoing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate ID
    const validatedId = RekapanOutgoingIdSchema.parse({ id: req.params.id });

    // Check if record exists
    const rekapan = await prisma.rekapanOutgoing.findUnique({
      where: { id: validatedId.id },
    });

    if (!rekapan) {
      throw createError('Rekapan tidak ditemukan', 404);
    }

    // Delete record
    await prisma.rekapanOutgoing.delete({
      where: { id: validatedId.id },
    });

    logError(`✓ Rekapan deleted successfully: ${validatedId.id}`, 'DELETE_SUCCESS');

    res.status(200).json({
      success: true,
      message: 'Rekapan berhasil dihapus',
      data: rekapan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'DELETE_REKAPAN');
    next(error);
  }
};

/**
 * Get rekapan summary statistics
 */
export const getRekapanSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter
    const where: any = {};

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = new Date(startDate as string);
      }
      if (endDate) {
        // treat endDate as inclusive end-of-day when a date-only string is provided
        const eStr = endDate as string;
        const eDate = new Date(eStr);
        if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) {
          eDate.setHours(23, 59, 59, 999);
        }
        where.tanggal.lte = eDate;
      }
    }

    // Execute queries
    const [totalCount, totalAmount, byMethod, dfodAgg, nonDfodAgg] = await Promise.all([
      prisma.rekapanOutgoing.count({ where }),
      prisma.rekapanOutgoing.aggregate({
        where,
        _sum: {
          total: true,
          jumlahKoli: true,
          beratKg: true,
          ongkir: true,
          asuransi: true,
          packing: true,
        },
        _avg: {
          beratKg: true,
        },
      }),
      prisma.rekapanOutgoing.groupBy({
        by: ['metodePembayaran'],
        where,
        _count: true,
        _sum: {
          total: true,
          ongkir: true,
          asuransi: true,
          packing: true,
        },
      }),
      prisma.rekapanOutgoing.aggregate({
        where: { ...where, metodePembayaran: 'DFOD' },
        _sum: {
          total: true,
          ongkir: true,
          asuransi: true,
          packing: true,
        },
      }),
      prisma.rekapanOutgoing.aggregate({
        where: { ...where, metodePembayaran: { not: 'DFOD' } as any },
        _sum: {
          total: true,
          ongkir: true,
          asuransi: true,
          packing: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Summary data berhasil diambil',
      data: {
        totalCount,
        totalAmount: totalAmount._sum.total || 0,
        totalOngkir: totalAmount._sum.ongkir || 0,
        totalAsuransi: totalAmount._sum.asuransi || 0,
        totalPacking: totalAmount._sum.packing || 0,
        totalKoli: totalAmount._sum.jumlahKoli || 0,
        totalWeight: totalAmount._sum.beratKg || 0,
        averageWeight: totalAmount._avg.beratKg || 0,
        byMethod: byMethod.map((item) => ({
          method: item.metodePembayaran,
          count: item._count,
          total: item._sum.total || 0,
          totalOngkir: item._sum.ongkir || 0,
          totalAsuransi: item._sum.asuransi || 0,
          totalPacking: item._sum.packing || 0,
        })),
        // DFOD-specific and non-DFOD totals
        totalOngkirDFOD: dfodAgg._sum.ongkir || 0,
        totalAsuransiDFOD: dfodAgg._sum.asuransi || 0,
        totalPackingDFOD: dfodAgg._sum.packing || 0,
        totalAmountDFOD: dfodAgg._sum.total || 0,
        totalOngkirNonDFOD: nonDfodAgg._sum.ongkir || 0,
        totalAsuransiNonDFOD: nonDfodAgg._sum.asuransi || 0,
        totalPackingNonDFOD: nonDfodAgg._sum.packing || 0,
        totalAmountNonDFOD: nonDfodAgg._sum.total || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'GET_SUMMARY');
    next(error);
  }
};
