import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError, logError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getPengeluaranSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, kategori } = req.query;
    const where: any = {};

    if (kategori) {
      where.kategori = String(kategori);
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) where.tanggal.gte = new Date(String(startDate));
      if (endDate) {
        const e = new Date(String(endDate));
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) e.setHours(23, 59, 59, 999);
        where.tanggal.lte = e;
      }
    }

    // total sums
    const totalAgg = await prisma.pengeluaran.aggregate({
      where,
      _sum: { nominal: true },
      _count: { _all: true },
    });

    // group by kategori
    const byKategori = await prisma.pengeluaran.groupBy({
      by: ['kategori'],
      where,
      _sum: { nominal: true },
      _count: { _all: true },
    });

    // group by metodePembayaran with breakdowns (nominal)
    const byMetode = await prisma.pengeluaran.groupBy({
      by: ['metodePembayaran'],
      where,
      _sum: { nominal: true },
      _count: { _all: true },
    });

    res.status(200).json({
      success: true,
      message: 'Pengeluaran summary retrieved',
      data: {
        totalCount: totalAgg._count._all || 0,
        totalNominal: totalAgg._sum.nominal || 0,
        byKategori: byKategori.map((b) => ({ kategori: b.kategori, count: b._count._all, total: b._sum.nominal || 0 })),
        byMetode: byMetode.map((m) => ({ metode: m.metodePembayaran, count: m._count._all, total: m._sum.nominal || 0 })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logError(err, 'GET_PENGELUARAN_SUMMARY');
    next(err);
  }
};

export const getPengeluaranList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, kategori, all } = req.query as any;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;
    const fetchAll = String(all || '').toLowerCase() === 'true';

    const where: any = {};
    if (kategori) where.kategori = String(kategori);
    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) where.tanggal.gte = new Date(String(startDate));
      if (endDate) {
        const e = new Date(String(endDate));
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) e.setHours(23, 59, 59, 999);
        where.tanggal.lte = e;
      }
    }

    let data: any[] = [];
    let total = 0;

    if (fetchAll) {
      data = await prisma.pengeluaran.findMany({ where, orderBy: { tanggal: 'desc' } });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prisma.pengeluaran.findMany({ where, skip, take: limitNum, orderBy: { tanggal: 'desc' } }),
        prisma.pengeluaran.count({ where }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: 'Pengeluaran records retrieved',
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logError(err, 'GET_PENGELUARAN_LIST');
    next(err);
  }
};

export const createPengeluaran = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tanggal, jenis, nominal, metodePembayaran, kategori, tipeKendaraan, jenisBahanBakar, liter, km } = req.body;
    if (!tanggal || !jenis || nominal == null || !metodePembayaran || !kategori) {
      throw createError('tanggal, jenis, nominal, metodePembayaran, dan kategori wajib diisi', 400);
    }

    const rec = await prisma.pengeluaran.create({
      data: {
        tanggal: new Date(String(tanggal)),
        jenis: String(jenis),
        nominal: Math.round(Number(nominal)),
        metodePembayaran: String(metodePembayaran) as any,
        kategori: String(kategori),
        tipeKendaraan: tipeKendaraan ? String(tipeKendaraan) : undefined,
        jenisBahanBakar: jenisBahanBakar ? String(jenisBahanBakar) : undefined,
        liter: liter !== undefined && liter !== null && liter !== '' ? Number(liter) : undefined,
        km: km !== undefined && km !== null && km !== '' ? Number(km) : undefined,
      },
    });

    res.status(201).json({ success: true, message: 'Pengeluaran dibuat', data: rec });
  } catch (err) {
    logError(err, 'CREATE_PENGELUARAN');
    next(err);
  }
};

export const updatePengeluaran = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const { tanggal, jenis, nominal, metodePembayaran, kategori, tipeKendaraan, jenisBahanBakar, liter, km } = req.body;

    const existing = await prisma.pengeluaran.findUnique({ where: { id } });
    if (!existing) throw createError('Pengeluaran tidak ditemukan', 404);

    const dataToUpdate: any = {};
    if (tanggal !== undefined) dataToUpdate.tanggal = new Date(String(tanggal));
    if (jenis !== undefined) dataToUpdate.jenis = String(jenis);
    if (nominal !== undefined) dataToUpdate.nominal = Math.round(Number(nominal));
    if (metodePembayaran !== undefined) dataToUpdate.metodePembayaran = String(metodePembayaran) as any;
    if (kategori !== undefined) dataToUpdate.kategori = String(kategori);
    if (tipeKendaraan !== undefined) dataToUpdate.tipeKendaraan = tipeKendaraan ? String(tipeKendaraan) : null;
    if (jenisBahanBakar !== undefined) dataToUpdate.jenisBahanBakar = jenisBahanBakar ? String(jenisBahanBakar) : null;
    if (liter !== undefined) dataToUpdate.liter = liter !== '' ? Number(liter) : null;
    if (km !== undefined) dataToUpdate.km = km !== '' ? Number(km) : null;

    const updated = await prisma.pengeluaran.update({ where: { id }, data: dataToUpdate });
    res.status(200).json({ success: true, message: 'Pengeluaran diperbarui', data: updated });
  } catch (err) {
    logError(err, 'UPDATE_PENGELUARAN');
    next(err);
  }
};

export const deletePengeluaran = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const existing = await prisma.pengeluaran.findUnique({ where: { id } });
    if (!existing) throw createError('Pengeluaran tidak ditemukan', 404);
    await prisma.pengeluaran.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Pengeluaran dihapus', data: existing });
  } catch (err) {
    logError(err, 'DELETE_PENGELUARAN');
    next(err);
  }
};
