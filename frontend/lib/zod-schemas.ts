import { z } from 'zod';

export const MetodePembayaranEnum = z.enum([
  'TRANSFER',
  'CASH',
  'TF_CASH',
  'PICKUP_ONLINE',
  'BULANAN',
  'DFOD',
]);

export const CreateRekapanOutgoingSchema = z.object({
  tanggal: z.coerce.date().describe('Tanggal pengiriman'),
  waybill: z.string().min(1, 'Waybill harus diisi').max(100, 'Waybill maksimal 100 karakter'),
  provinsi: z.string().min(1, 'Provinsi harus diisi').max(100, 'Provinsi maksimal 100 karakter'),
  jenisBarang: z.string().min(1, 'Jenis barang harus diisi').max(150, 'Jenis barang maksimal 150 karakter'),
  jumlahKoli: z.coerce.number().int().positive('Jumlah koli harus > 0'),
  beratKg: z.coerce.number().positive('Berat harus > 0'),
  ongkir: z.coerce.number().int().min(0, 'Ongkir tidak boleh negatif'),
  asuransi: z.coerce.number().int().min(0, 'Asuransi tidak boleh negatif'),
  packing: z.coerce.number().int().min(0, 'Packing tidak boleh negatif'),
  metodePembayaran: MetodePembayaranEnum,
});

export const UpdateRekapanOutgoingSchema = CreateRekapanOutgoingSchema.partial();
export const RekapanOutgoingIdSchema = z.object({
  id: z.string().uuid('ID harus UUID valid'),
});

export const CreateRekapanInternalSchema = z.object({
  tanggalRekap: z
    .preprocess((value) => {
      if (value === undefined || value === null || String(value).trim() === '') return undefined;
      return new Date(String(value));
    }, z.date({ invalid_type_error: 'Tanggal Rekap tidak valid', required_error: 'Tanggal Rekap harus diisi' }))
    .optional(),
  waybill: z.string().min(1, 'Waybill harus diisi').max(100, 'Waybill maksimal 100 karakter'),
  jumlahKoli: z.coerce.number().int().positive('Jumlah koli harus > 0'),
  sprinterDelivery: z.string().min(1, 'Sprinter Delivery harus diisi').max(100, 'Sprinter Delivery maksimal 100 karakter'),
  jumlahPembayaranCOD: z.coerce.number().int().min(0, 'Jumlah pembayaran COD tidak boleh negatif'),
  biayaDFOD: z.coerce.number().int().min(0, 'Biaya DFOD tidak boleh negatif'),
});

export const UpdateRekapanInternalSchema = CreateRekapanInternalSchema.partial();
export const RekapanInternalIdSchema = z.object({
  id: z.string().uuid('ID harus UUID valid'),
});

export const CreateEmployeeSchema = z.object({
  name: z.string().trim().min(1, 'Nama karyawan harus diisi'),
  role: z.enum(['Admin', 'Driver']),
});

const baseScheduleAttendanceSchema = z.object({
  tanggal: z.coerce.date().describe('Tanggal kehadiran'),
  employeeId: z.string().uuid('Employee ID harus berupa UUID valid'),
  attendanceStatus: z.enum([
    'Hadir',
    'Sakit',
    'Izin',
    'Alpha',
    'Full GW + Deliv',
    'Full GW No Deliv',
    'GW Setengah',
  ]),
  keterangan: z.string().trim().max(1000, 'Keterangan maksimal 1000 karakter').optional().or(z.literal('')),
  partnerId: z.string().uuid('Partner ID harus UUID valid').optional(),
});

const validateScheduleAttendancePartner = (data: { attendanceStatus?: string; partnerId?: string }, ctx: z.RefinementCtx) => {
  const allowedWithPartner = ['Hadir', 'GW Setengah', 'Full GW + Deliv', 'Full GW No Deliv'];
  if (data.attendanceStatus && !allowedWithPartner.includes(data.attendanceStatus) && data.partnerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Partner hanya boleh dipilih untuk status Hadir, GW Setengah, Full GW + Deliv, atau Full GW No Deliv',
      path: ['partnerId'],
    });
  }
  // partner is optional for allowed statuses
};

export const CreateScheduleAttendanceSchema = baseScheduleAttendanceSchema.superRefine(validateScheduleAttendancePartner);
export const UpdateScheduleAttendanceSchema = baseScheduleAttendanceSchema.partial().superRefine(validateScheduleAttendancePartner);
export const EmployeeIdSchema = z.object({ id: z.string().uuid('Employee ID harus UUID valid') });
export const ScheduleAttendanceIdSchema = z.object({ id: z.string().uuid('Attendance ID harus UUID valid') });

export const PayrollRateSchema = z.object({
  adminBase: z.coerce.number().int().min(0, 'Gaji pokok admin tidak boleh negatif'),
  driverBase: z.coerce.number().int().min(0, 'Gaji pokok driver tidak boleh negatif'),
  makan: z.coerce.number().int().min(0, 'Uang makan tidak boleh negatif'),
  awb: z.coerce.number().int().min(0, 'Bonus AWB tidak boleh negatif'),
  gw: z.coerce.number().int().min(0, 'Bonus GW tidak boleh negatif'),
});

export const PayrollHistoryRowSchema = z.object({
  employeeId: z.string().uuid('Employee ID harus UUID valid'),
  employeeName: z.string().trim().min(1, 'Nama karyawan harus diisi'),
  role: z.enum(['Admin', 'Driver']),
  hadirCount: z.coerce.number().int().min(0, 'Hadir count tidak boleh negatif'),
  basePay: z.coerce.number().int().min(0, 'Gaji pokok tidak boleh negatif'),
  makanPay: z.coerce.number().int().min(0, 'Uang makan tidak boleh negatif'),
  bonusManual: z.coerce.number().int().min(0, 'Bonus manual tidak boleh negatif'),
  awbBonus: z.coerce.number().int().min(0, 'Bonus AWB tidak boleh negatif'),
  gwBonus: z.coerce.number().int().min(0, 'Bonus GW tidak boleh negatif'),
  bonusTotal: z.coerce.number().int().min(0, 'Total bonus tidak boleh negatif'),
  kasbonAmount: z.coerce.number().int().min(0, 'Kasbon tidak boleh negatif'),
  grossPay: z.coerce.number().int().min(0, 'Gaji kotor tidak boleh negatif'),
  netPay: z.coerce.number().int(),
});

export const SavePayrollHistorySchema = z.object({
  month: z.string().min(1, 'Bulan harus diisi'),
  rows: z.array(PayrollHistoryRowSchema),
});

export const CreateKasbonSchema = z.object({
  employee: z.string().min(1, 'Employee harus diisi'),
  tanggal: z.coerce.date(),
  amount: z.coerce.number().int().min(0, 'Amount tidak boleh negatif'),
  description: z.string().optional().or(z.literal('')),
  settled: z.boolean().optional(),
});

export const UpdateKasbonSchema = CreateKasbonSchema.partial();

export const CreatePengeluaranSchema = z.object({
  tanggal: z.coerce.date(),
  jenis: z.string().min(1, 'Jenis harus diisi'),
  nominal: z.coerce.number().int().min(0, 'Nominal tidak boleh negatif'),
  metodePembayaran: MetodePembayaranEnum,
  kategori: z.string().min(1, 'Kategori harus diisi'),
  tipeKendaraan: z.string().optional().or(z.literal('')),
  jenisBahanBakar: z.string().optional().or(z.literal('')),
  liter: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  }, z.number().optional()),
  km: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  }, z.number().optional()),
});

export const UpdatePengeluaranSchema = CreatePengeluaranSchema.partial();
