import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError, logError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getKasbonSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) where.tanggal.gte = new Date(String(startDate));
      if (endDate) {
        const e = new Date(String(endDate));
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) e.setHours(23, 59, 59, 999);
        where.tanggal.lte = e;
      }
    }

    // group by employee
    const grouped = await prisma.kasbon.groupBy({
      by: ['employee'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    });

    const total = await prisma.kasbon.aggregate({
      where,
      _sum: { amount: true },
      _count: { _all: true },
    });

    res.status(200).json({
      success: true,
      message: 'Kasbon summary retrieved',
      data: {
        totalCount: total._count._all || 0,
        totalAmount: total._sum.amount || 0,
        byEmployee: grouped.map((g) => ({ employee: g.employee, count: g._count._all, totalAmount: g._sum.amount || 0 })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logError(err, 'GET_KASBON_SUMMARY');
    next(err);
  }
};

export const getKasbonList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, employee, all } = req.query as any;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(10000, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;
    const fetchAll = String(all || '').toLowerCase() === 'true';

    const where: any = {};
    if (employee) where.employee = { equals: String(employee) };
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
      data = await prisma.kasbon.findMany({ where, orderBy: { tanggal: 'desc' } });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prisma.kasbon.findMany({ where, skip, take: limitNum, orderBy: { tanggal: 'desc' } }),
        prisma.kasbon.count({ where }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: 'Kasbon records retrieved',
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
    logError(err, 'GET_KASBON_LIST');
    next(err);
  }
};

export const createKasbon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee, tanggal, amount, description, settled } = req.body;
    if (!employee || !tanggal || amount == null) {
      throw createError('Employee, tanggal, dan amount wajib diisi', 400);
    }

    const rec = await prisma.kasbon.create({
      data: {
        employee: String(employee),
        tanggal: new Date(String(tanggal)),
        amount: Math.round(Number(amount)),
        description: description ? String(description) : null,
        settled: Boolean(settled),
      },
    });

    res.status(201).json({ success: true, message: 'Kasbon dibuat', data: rec });
  } catch (err) {
    logError(err, 'CREATE_KASBON');
    next(err);
  }
};

export const updateKasbon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const { employee, tanggal, amount, description, settled } = req.body;

    const existing = await prisma.kasbon.findUnique({ where: { id } });
    if (!existing) throw createError('Kasbon tidak ditemukan', 404);

    const dataToUpdate: any = {};
    if (employee !== undefined) dataToUpdate.employee = String(employee);
    if (tanggal !== undefined) dataToUpdate.tanggal = new Date(String(tanggal));
    if (amount !== undefined) dataToUpdate.amount = Math.round(Number(amount));
    if (description !== undefined) dataToUpdate.description = description === null ? null : String(description);
    if (settled !== undefined) dataToUpdate.settled = Boolean(settled);

    const updated = await prisma.kasbon.update({ where: { id }, data: dataToUpdate });
    res.status(200).json({ success: true, message: 'Kasbon diperbarui', data: updated });
  } catch (err) {
    logError(err, 'UPDATE_KASBON');
    next(err);
  }
};

export const deleteKasbon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const existing = await prisma.kasbon.findUnique({ where: { id } });
    if (!existing) throw createError('Kasbon tidak ditemukan', 404);
    await prisma.kasbon.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Kasbon dihapus', data: existing });
  } catch (err) {
    logError(err, 'DELETE_KASBON');
    next(err);
  }
};
