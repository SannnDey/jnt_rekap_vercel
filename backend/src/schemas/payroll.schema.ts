import { z } from 'zod';

export const PayrollRateMonthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format bulan harus YYYY-MM'),
});

export const PayrollRateSchema = z.object({
  adminBase: z.coerce.number().int().min(0, 'Gaji pokok admin harus minimal 0'),
  driverBase: z.coerce.number().int().min(0, 'Gaji pokok driver harus minimal 0'),
  makan: z.coerce.number().int().min(0, 'Uang makan harus minimal 0'),
  awb: z.coerce.number().int().min(0, 'Bonus AWB harus minimal 0'),
  gw: z.coerce.number().int().min(0, 'Bonus GW harus minimal 0'),
});

export const PayrollHistoryRowSchema = z.object({
  employeeId: z.string().uuid('Employee ID harus UUID valid'),
  employeeName: z.string().min(1, 'Nama karyawan harus diisi'),
  role: z.enum(['Admin', 'Driver']),
  hadirCount: z.coerce.number().int().min(0),
  basePay: z.coerce.number().int().min(0),
  makanPay: z.coerce.number().int().min(0),
  bonusManual: z.coerce.number().int().min(0),
  awbBonus: z.coerce.number().int().min(0),
  gwBonus: z.coerce.number().int().min(0),
  bonusTotal: z.coerce.number().int().min(0),
  kasbonAmount: z.coerce.number().int().min(0),
  grossPay: z.coerce.number().int().min(0),
  netPay: z.coerce.number().int().min(0),
});

export const PayrollHistorySaveSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format bulan harus YYYY-MM'),
  rows: z.array(PayrollHistoryRowSchema).min(1, 'Minimal satu baris riwayat harus disimpan'),
});

export type PayrollRateInput = z.infer<typeof PayrollRateSchema>;
export type PayrollRateMonthInput = z.infer<typeof PayrollRateMonthSchema>;
export type PayrollHistorySaveInput = z.infer<typeof PayrollHistorySaveSchema>;
