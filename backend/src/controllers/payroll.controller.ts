import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError, logError } from '../middleware/errorHandler';
import {
  PayrollRateMonthSchema,
  PayrollRateSchema,
  PayrollHistorySaveSchema,
} from '../schemas/payroll.schema';

const prisma = new PrismaClient();

export const getPayrollRate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    PayrollRateMonthSchema.parse({ month });

    const payrollRate = await prisma.payrollRate.findUnique({
      where: { month },
    });

    res.status(200).json({
      success: true,
      message: payrollRate ? 'Tarif payroll berhasil diambil' : 'Tarif payroll belum tersedia untuk bulan ini',
      data: payrollRate ?? null,
    });
  } catch (error) {
    logError(error, 'GET_PAYROLL_RATE');
    next(error);
  }
};

export const upsertPayrollRate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month } = req.params;
    PayrollRateMonthSchema.parse({ month });
    const validated = PayrollRateSchema.parse(req.body);

    const payrollRate = await prisma.payrollRate.upsert({
      where: { month },
      create: {
        month,
        ...validated,
      },
      update: {
        ...validated,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Tarif payroll berhasil disimpan',
      data: payrollRate,
    });
  } catch (error) {
    logError(error, 'UPSERT_PAYROLL_RATE');
    next(error);
  }
};

export const getPayrollHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    PayrollRateMonthSchema.parse({ month });

    const history = await prisma.payrollHistory.findMany({
      where: { month },
      orderBy: { employeeName: 'asc' },
    });

    res.status(200).json({
      success: true,
      message: history.length > 0 ? 'Riwayat gaji berhasil diambil' : 'Riwayat gaji masih kosong untuk bulan ini',
      data: history,
    });
  } catch (error) {
    logError(error, 'GET_PAYROLL_HISTORY');
    next(error);
  }
};

export const savePayrollHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = PayrollHistorySaveSchema.parse(req.body);

    await prisma.$transaction([
      prisma.payrollHistory.deleteMany({ where: { month: validated.month } }),
      prisma.payrollHistory.createMany({
        data: validated.rows.map((row) => ({
          month: validated.month,
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          role: row.role,
          hadirCount: row.hadirCount,
          basePay: row.basePay,
          makanPay: row.makanPay,
          bonusManual: row.bonusManual,
          awbBonus: row.awbBonus,
          gwBonus: row.gwBonus,
          bonusTotal: row.bonusTotal,
          kasbonAmount: row.kasbonAmount,
          grossPay: row.grossPay,
          netPay: row.netPay,
        })),
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Riwayat gaji berhasil disimpan',
    });
  } catch (error) {
    logError(error, 'SAVE_PAYROLL_HISTORY');
    next(error);
  }
};
