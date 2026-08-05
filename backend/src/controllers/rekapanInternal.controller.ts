import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  CreateRekapanInternalSchema,
  UpdateRekapanInternalSchema,
  RekapanInternalIdSchema,
} from '../schemas/rekapanInternal.schema';
import { createError, logError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const prismaClient = prisma;

const roundToInt = (value: number): number => Math.round(value);

const parseDateQueryParam = (value: unknown, fieldName: string): Date => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw createError(`${fieldName} harus diisi`, 400);
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw createError(`${fieldName} tidak valid`, 400);
  }

  return date;
};

export const createRekapanInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = CreateRekapanInternalSchema.parse(req.body);
    const sanitizedData = {
      ...validatedData,
      ...(validatedData.tanggalRekap ? { tanggalRekap: validatedData.tanggalRekap } : {}),
      jumlahKoli: roundToInt(validatedData.jumlahKoli),
      jumlahPembayaranCOD: roundToInt(validatedData.jumlahPembayaranCOD),
      biayaDFOD: roundToInt(validatedData.biayaDFOD),
    };

    const rekapan = await prismaClient.rekapanInternal.create({ data: sanitizedData });

    res.status(201).json({
      success: true,
      message: 'Rekapan internal harian berhasil dibuat',
      data: rekapan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'CREATE_REKAPAN_INTERNAL');
    next(error);
  }
};

export const importRekapanInternal = async (
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

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      try {
        const parsed = CreateRekapanInternalSchema.parse(row);
        validData.push({
          ...(parsed.tanggalRekap ? { tanggalRekap: parsed.tanggalRekap } : {}),
          ...parsed,
          jumlahKoli: roundToInt(parsed.jumlahKoli),
          jumlahPembayaranCOD: roundToInt(parsed.jumlahPembayaranCOD),
          biayaDFOD: roundToInt(parsed.biayaDFOD),
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          rowErrors.push({
            rowIndex: row.rowIndex ?? i + 1,
            errors: err.errors.map((e) => e.message),
          });
        } else {
          rowErrors.push({ rowIndex: row.rowIndex ?? i + 1, errors: [String(err)] });
        }
      }
    }

    if (rowErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: rowErrors });
    }

    await prismaClient.rekapanInternal.createMany({ data: validData });

    res.status(201).json({
      success: true,
      message: `${validData.length} baris rekapan internal berhasil diimpor`,
    });
  } catch (error) {
    logError(error, 'IMPORT_REKAPAN_INTERNAL');
    next(error);
  }
};

export const getAllRekapanInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate } = req.query;
    const { sortBy, sortOrder } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;
    const all = String(req.query.all || '').toLowerCase() === 'true';

    const where: any = {};
    if (search) {
      where.OR = [
        { waybill: { contains: String(search), mode: 'insensitive' } },
        { sprinterDelivery: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.tanggalRekap = {};
      if (startDate) {
        const fromDate = parseDateQueryParam(startDate, 'Tanggal awal');
        where.tanggalRekap.gte = fromDate;
      }
      if (endDate) {
        const eStr = String(endDate);
        const eDate = parseDateQueryParam(eStr, 'Tanggal akhir');
        if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) {
          eDate.setHours(23, 59, 59, 999);
        }
        where.tanggalRekap.lte = eDate;
      }
    }

    const orderBy = (() => {
      const sb = String(sortBy || 'createdAt');
      const so = (String(sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder;
      if (sb === 'tanggalRekap') return { tanggalRekap: so };
      if (sb === 'createdAt') return { createdAt: so };
      if (sb === 'waybill') return { waybill: so };
      if (sb === 'jumlahKoli') return { jumlahKoli: so };
      if (sb === 'jumlahPembayaranCOD') return { jumlahPembayaranCOD: so };
      if (sb === 'biayaDFOD') return { biayaDFOD: so };
      return { createdAt: 'desc' as Prisma.SortOrder };
    })();

    let data: any[] = [];
    let total = 0;

    if (all) {
      data = await prismaClient.rekapanInternal.findMany({ where, orderBy });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prismaClient.rekapanInternal.findMany({ where, skip, take: limitNum, orderBy }),
        prismaClient.rekapanInternal.count({ where }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: 'Data rekapan internal berhasil diambil',
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
    logError(error, 'GET_ALL_REKAPAN_INTERNAL');
    next(error);
  }
};

export const getRekapanInternalById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = RekapanInternalIdSchema.parse(req.params);
    const rekapan = await prismaClient.rekapanInternal.findUnique({ where: { id } });
    if (!rekapan) {
      throw createError('Data rekapan internal tidak ditemukan', 404);
    }
    res.status(200).json({
      success: true,
      message: 'Data rekapan internal berhasil diambil',
      data: rekapan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'GET_REKAPAN_INTERNAL_BY_ID');
    next(error);
  }
};

const logActivity = async (type: string, details: any, user?: string) => {
  try {
    await prismaClient.activityLog.create({
      data: {
        type,
        details: JSON.stringify(details).slice(0, 2000),
        user: user || null,
      },
    });
  } catch (e) {
    // don't block main flow for logging errors
    console.warn('Failed to write activity log', e);
  }
};

export const exportRekapanInternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, startDate, endDate } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { waybill: { contains: String(search), mode: 'insensitive' } },
        { sprinterDelivery: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (startDate) {
      const sDate = new Date(String(startDate));
      where.tanggalRekap = { ...(where.tanggalRekap || {}), gte: sDate };
    }
    if (endDate) {
      const eStr = String(endDate);
      const eDate = new Date(eStr);
      if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) {
        eDate.setHours(23, 59, 59, 999);
      }
      where.tanggalRekap = { ...(where.tanggalRekap || {}), lte: eDate };
    }
    const rows = await prismaClient.rekapanInternal.findMany({ where, orderBy: { tanggalRekap: 'desc' } as any });

    // create excel workbook with two sheets: Data and SummaryBySprinter
    const exceljsModule = await import('exceljs');
    const WorkbookCtor = (exceljsModule as any).Workbook ?? (exceljsModule as any).default?.Workbook ?? (exceljsModule as any).default ?? (exceljsModule as any);
    if (!WorkbookCtor) throw new Error('ExcelJS Workbook constructor not found');
    const workbook = new WorkbookCtor();

    // Build a single sheet styled like outgoing export
    const worksheet = workbook.addWorksheet('Rekapan');

    worksheet.columns = [
      { header: 'Tanggal Rekap', key: 'tanggalRekap', width: 20 },
      { header: 'Waybill', key: 'waybill', width: 18 },
      { header: 'Sprinter Delivery', key: 'sprinterDelivery', width: 20 },
      { header: 'Jumlah Koli', key: 'jumlahKoli', width: 12 },
      { header: 'Jumlah Pembayaran COD', key: 'jumlahPembayaranCOD', width: 16 },
      { header: 'Biaya DFOD', key: 'biayaDFOD', width: 14 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    // Title row
    const titleRow = worksheet.addRow(['REKAPAN INTERNAL HARIAN']);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } } as any;
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333399' } } as any;
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' } as any;
    worksheet.mergeCells('A1:G1');
    titleRow.height = 26;

    // Period info
    const periodLabel = (() => {
      const s = startDate ? String(startDate) : '';
      const e = endDate ? String(endDate) : '';
      if (s && e) return `Periode Rekap: ${s} - ${e}`;
      if (s) return `Periode Rekap mulai: ${s}`;
      if (e) return `Periode Rekap sampai: ${e}`;
      return 'Periode Rekap: Semua waktu';
    })();
    const periodRow = worksheet.addRow([periodLabel]);
    periodRow.font = { bold: true, size: 11 } as any;
    worksheet.mergeCells('A2:G2');
    periodRow.height = 18;

    worksheet.addRow([]);

    // Header row
    const headerRow = worksheet.addRow([
      'Tanggal Rekap', 'Waybill', 'Sprinter Delivery', 'Jumlah Koli', 'Jumlah Pembayaran COD', 'Biaya DFOD', 'Created At'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 } as any;
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } } as any;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' } as any;
    headerRow.height = 20;

    let totalKoli = 0;
    let totalCOD = 0;
    let totalDFOD = 0;

    rows.forEach((r) => {
      const tanggalVal = r.tanggalRekap ? new Date(r.tanggalRekap) : null;
      const createdVal = r.createdAt ? new Date(r.createdAt) : null;
      const row = worksheet.addRow([
        tanggalVal instanceof Date && !isNaN(tanggalVal.getTime()) ? tanggalVal : r.tanggalRekap || '',
        r.waybill,
        r.sprinterDelivery,
        r.jumlahKoli,
        r.jumlahPembayaranCOD,
        r.biayaDFOD,
        createdVal instanceof Date && !isNaN(createdVal.getTime()) ? createdVal : r.createdAt || '',
      ]);
      row.eachCell((cell: any) => { cell.font = { size: 10 }; cell.alignment = { vertical: 'middle', horizontal: 'left' }; });

      totalKoli += r.jumlahKoli || 0;
      totalCOD += r.jumlahPembayaranCOD || 0;
      totalDFOD += r.biayaDFOD || 0;
    });

    // Empty row then totals
    worksheet.addRow([]);
    const totalsRow = worksheet.addRow(['', `Total Waybill: ${rows.length}`, '', totalKoli, totalCOD, totalDFOD, '']);
    totalsRow.font = { bold: true, size: 11 } as any;
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } } as any;

    // Summary section (by sprinter)
    worksheet.addRow([]);
    const summaryHeader = worksheet.addRow(['RINGKASAN PER SPRINTER']);
    summaryHeader.font = { bold: true } as any;
    worksheet.mergeCells(`A${summaryHeader.number}:C${summaryHeader.number}`);

    const bySprinter = await prismaClient.rekapanInternal.groupBy({
      by: ['sprinterDelivery'],
      where,
      _count: { id: true },
      _sum: { jumlahKoli: true, jumlahPembayaranCOD: true, biayaDFOD: true },
    });

    bySprinter.forEach((g) => {
      const r = worksheet.addRow([g.sprinterDelivery, g._count.id, g._sum.jumlahKoli ?? 0, g._sum.jumlahPembayaranCOD ?? 0, g._sum.biayaDFOD ?? 0]);
      r.getCell(2).alignment = { horizontal: 'right' } as any;
      r.getCell(3).alignment = { horizontal: 'right' } as any;
      r.getCell(4).alignment = { horizontal: 'right' } as any;
    });

    worksheet.views = [{ state: 'frozen', ySplit: headerRow.number }];

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="rekapan_internal.xlsx"');
    logActivity('export', { format: 'xlsx', count: rows.length, query: req.query });
    res.send(Buffer.from(buffer));
  } catch (error) {
    logError(error, 'EXPORT_REKAPAN_INTERNAL');
    next(error);
  }
};

export const exportRekapanInternalSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    if (startDate) where.tanggalRekap = { gte: new Date(String(startDate)) };
    if (endDate) where.tanggalRekap = { ...(where.tanggalRekap || {}), lte: new Date(String(endDate)) };

    const bySprinter = await prismaClient.rekapanInternal.groupBy({
      by: ['sprinterDelivery'],
      where,
      _count: { id: true },
      _sum: { jumlahKoli: true, jumlahPembayaranCOD: true, biayaDFOD: true },
    });

    const headers = ['sprinterDelivery', 'countAwb', 'totalKoli', 'totalCOD', 'totalDFOD'];
    const csv = [headers.join(',')].concat(
      bySprinter.map((g) =>
        [
          '"' + String(g.sprinterDelivery).replace(/"/g, '""') + '"',
          String(g._count.id),
          String(g._sum.jumlahKoli ?? 0),
          String(g._sum.jumlahPembayaranCOD ?? 0),
          String(g._sum.biayaDFOD ?? 0),
        ].join(',')
      )
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rekapan_internal_summary_by_sprinter.csv"');
    logActivity('export_summary', { count: bySprinter.length, query: req.query });
    res.send(csv);
  } catch (error) {
    logError(error, 'EXPORT_REKAPAN_INTERNAL_SUMMARY');
    next(error);
  }
};

export const bulkDeleteRekapanInternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (ids.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada id yang diberikan' });
    const result = await prismaClient.rekapanInternal.deleteMany({ where: { id: { in: ids } } });
    logActivity('bulk_delete', { ids, deleted: result.count });
    res.status(200).json({ success: true, message: `${result.count} data berhasil dihapus` });
  } catch (error) {
    logError(error, 'BULK_DELETE_REKAPAN_INTERNAL');
    next(error);
  }
};

export const bulkUpdateRekapanInternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const data = req.body.data || {};
    if (ids.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada id yang diberikan' });
    // sanitize allowed fields
    const allowed: any = {};
    if (data.sprinterDelivery) allowed.sprinterDelivery = String(data.sprinterDelivery);
    if (data.jumlahKoli !== undefined) allowed.jumlahKoli = Number(data.jumlahKoli);
    if (data.jumlahPembayaranCOD !== undefined) allowed.jumlahPembayaranCOD = Number(data.jumlahPembayaranCOD);
    if (data.biayaDFOD !== undefined) allowed.biayaDFOD = Number(data.biayaDFOD);
    if (Object.keys(allowed).length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data yang valid untuk diperbarui' });

    const result = await prismaClient.rekapanInternal.updateMany({ where: { id: { in: ids } }, data: allowed as any });
    logActivity('bulk_update', { ids, updated: result.count, data: allowed });
    res.status(200).json({ success: true, message: `${result.count} data berhasil diperbarui` });
  } catch (error) {
    logError(error, 'BULK_UPDATE_REKAPAN_INTERNAL');
    next(error);
  }
};

export const getRekapanInternalReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, period = 'weekly' } = req.query;
    const where: any = {};
    if (startDate) where.tanggalRekap = { gte: new Date(String(startDate)) };
    if (endDate) where.tanggalRekap = { ...(where.tanggalRekap || {}), lte: new Date(String(endDate)) };
    const rows = await prismaClient.rekapanInternal.findMany({ where, orderBy: { tanggalRekap: 'asc' } as any });

    const groupMap: Record<string, { count: number; totalKoli: number; totalCOD: number; totalDFOD: number }> = {};

    const getKey = (d: Date) => {
      const dt = new Date(d);
      if (String(period) === 'monthly') {
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      }
      // weekly: year-weekNumber (ISO-like, Monday as first day)
      const tmp = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      const dayNum = (tmp.getUTCDay() + 6) % 7;
      tmp.setUTCDate(tmp.getUTCDate() - dayNum);
      return `${tmp.getUTCFullYear()}-${String(tmp.getUTCMonth() + 1).padStart(2, '0')}-${String(tmp.getUTCDate()).padStart(2, '0')}`;
    };

    for (const r of rows) {
      const key = getKey(new Date(r.tanggalRekap));
      if (!groupMap[key]) groupMap[key] = { count: 0, totalKoli: 0, totalCOD: 0, totalDFOD: 0 };
      groupMap[key].count += 1;
      groupMap[key].totalKoli += r.jumlahKoli;
      groupMap[key].totalCOD += r.jumlahPembayaranCOD;
      groupMap[key].totalDFOD += r.biayaDFOD;
    }

    const report = Object.entries(groupMap).map(([periodLabel, v]) => ({ period: periodLabel, ...v }));
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    logError(error, 'GET_REKAPAN_INTERNAL_REPORT');
    next(error);
  }
};

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prismaClient.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    logError(error, 'GET_ACTIVITY_LOGS');
    next(error);
  }
};

export const updateRekapanInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = RekapanInternalIdSchema.parse(req.params);
    const validatedData = UpdateRekapanInternalSchema.parse(req.body);
    const sanitizedData = {
      ...validatedData,
      ...(validatedData.jumlahKoli !== undefined ? { jumlahKoli: roundToInt(validatedData.jumlahKoli) } : {}),
      ...(validatedData.jumlahPembayaranCOD !== undefined
        ? { jumlahPembayaranCOD: roundToInt(validatedData.jumlahPembayaranCOD) }
        : {}),
      ...(validatedData.biayaDFOD !== undefined ? { biayaDFOD: roundToInt(validatedData.biayaDFOD) } : {}),
    };

    const rekapan = await prismaClient.rekapanInternal.update({
      where: { id },
      data: sanitizedData,
    });

    res.status(200).json({
      success: true,
      message: 'Rekapan internal berhasil diperbarui',
      data: rekapan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'UPDATE_REKAPAN_INTERNAL');
    next(error);
  }
};

export const deleteRekapanInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = RekapanInternalIdSchema.parse(req.params);
    await prismaClient.rekapanInternal.delete({ where: { id } });
    res.status(200).json({
      success: true,
      message: 'Rekapan internal berhasil dihapus',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'DELETE_REKAPAN_INTERNAL');
    next(error);
  }
};

export const getRekapanInternalSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate || endDate) {
      where.tanggalRekap = {};
      if (startDate) {
        const fromDate = parseDateQueryParam(startDate, 'Tanggal awal');
        where.tanggalRekap.gte = fromDate;
      }
      if (endDate) {
        const eStr = String(endDate);
        const eDate = parseDateQueryParam(eStr, 'Tanggal akhir');
        if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) {
          eDate.setHours(23, 59, 59, 999);
        }
        where.tanggalRekap.lte = eDate;
      }
    }

    const totalAwb = await prismaClient.rekapanInternal.count({ where });
    const totals = await prismaClient.rekapanInternal.aggregate({
      where,
      _sum: {
        jumlahKoli: true,
        jumlahPembayaranCOD: true,
        biayaDFOD: true,
      },
    });

    const bySprinter = await prismaClient.rekapanInternal.groupBy({
      by: ['sprinterDelivery'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        jumlahKoli: true,
        jumlahPembayaranCOD: true,
        biayaDFOD: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Ringkasan rekapan internal berhasil diambil',
      data: {
        totalAwb,
        totalKoli: totals._sum.jumlahKoli ?? 0,
        totalCOD: totals._sum.jumlahPembayaranCOD ?? 0,
        totalDFOD: totals._sum.biayaDFOD ?? 0,
        bySprinter: bySprinter.map((group) => ({
          sprinterDelivery: group.sprinterDelivery,
          countAwb: group._count.id,
          totalKoli: group._sum.jumlahKoli ?? 0,
          totalCOD: group._sum.jumlahPembayaranCOD ?? 0,
          totalDFOD: group._sum.biayaDFOD ?? 0,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'GET_REKAPAN_INTERNAL_SUMMARY');
    next(error);
  }
};
