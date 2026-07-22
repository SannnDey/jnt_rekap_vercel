import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
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

    // Calculate total
    const total = calculateTotal(
      validatedData.ongkir,
      validatedData.asuransi,
      validatedData.packing
    );

    // Create record
    const rekapan = await prisma.rekapanOutgoing.create({
      data: {
        ...validatedData,
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
 * Get all rekapan outgoing with pagination and filters
 */
export const getAllRekapanOutgoing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate } = req.query;

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};

    if (search) {
      where.OR = [
        { waybill: { contains: search as string } },
        { provinsi: { contains: search as string } },
        { jenisBarang: { contains: search as string } },
      ];
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.tanggal.lte = new Date(endDate as string);
      }
    }

    // Execute queries
    const [data, total] = await Promise.all([
      prisma.rekapanOutgoing.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { tanggal: 'desc' },
      }),
      prisma.rekapanOutgoing.count({ where }),
    ]);

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
        where.tanggal.lte = new Date(endDate as string);
      }
    }

    // Execute queries
    const [totalCount, totalAmount, byMethod] = await Promise.all([
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
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'GET_SUMMARY');
    next(error);
  }
};
