export enum MetodePembayaran {
  TRANSFER = 'TRANSFER',
  CASH = 'CASH',
  TF_CASH = 'TF_CASH',
  PICKUP_ONLINE = 'PICKUP_ONLINE',
  BULANAN = 'BULANAN',
  DFOD = 'DFOD',
}

export const MetodePembayaranValues = Object.values(MetodePembayaran) as MetodePembayaran[];
export const isValidMetodePembayaran = (value: string): value is MetodePembayaran =>
  MetodePembayaranValues.includes(value as MetodePembayaran);

export interface RekapanOutgoing {
  id: string;
  tanggalRekap: string;
  tanggal: string;
  waybill: string;
  provinsi: string;
  jenisBarang: string;
  jumlahKoli: number;
  beratKg: number;
  ongkir: number;
  asuransi: number;
  packing: number;
  total: number;
  metodePembayaran: MetodePembayaran;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRekapanInput {
  tanggal: Date;
  waybill: string;
  provinsi: string;
  jenisBarang: string;
  jumlahKoli: number;
  beratKg: number;
  ongkir: number;
  asuransi: number;
  packing: number;
  metodePembayaran: MetodePembayaran;
}

export interface UpdateRekapanInput {
  tanggal?: Date;
  waybill?: string;
  provinsi?: string;
  jenisBarang?: string;
  jumlahKoli?: number;
  beratKg?: number;
  ongkir?: number;
  asuransi?: number;
  packing?: number;
  metodePembayaran?: MetodePembayaran;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SummaryData {
  totalCount: number;
  totalAmount: number;
  totalOngkir: number;
  totalAsuransi: number;
  totalPacking: number;
  totalKoli: number;
  totalWeight: number;
  averageWeight: number;
  byMethod: Array<{
    method: MetodePembayaran;
    count: number;
    total: number;
    totalOngkir?: number;
    totalAsuransi?: number;
    totalPacking?: number;
  }>;
  // DFOD / non-DFOD breakdowns
  totalOngkirDFOD?: number;
  totalAsuransiDFOD?: number;
  totalPackingDFOD?: number;
  totalAmountDFOD?: number;
  totalOngkirNonDFOD?: number;
  totalAsuransiNonDFOD?: number;
  totalPackingNonDFOD?: number;
  totalAmountNonDFOD?: number;
}

export interface KasbonRecord {
  id: string;
  employee: string;
  tanggal: string;
  amount: number;
  description?: string | null;
  settled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KasbonSummaryByEmployee {
  employee: string;
  count: number;
  totalAmount: number;
}

export interface KasbonSummary {
  totalCount: number;
  totalAmount: number;
  byEmployee: KasbonSummaryByEmployee[];
}

export interface PengeluaranRecord {
  id: string;
  tanggal: string;
  jenis: string;
  nominal: number;
  metodePembayaran: MetodePembayaran;
  kategori: string;
  tipeKendaraan?: string;
  jenisBahanBakar?: string;
  liter?: number;
  km?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PengeluaranSummaryByKategori {
  kategori: string;
  count: number;
  total: number;
}

export interface PengeluaranSummaryByMetode {
  metode: MetodePembayaran;
  count: number;
  total: number;
}

export interface PengeluaranSummary {
  totalCount: number;
  totalNominal: number;
  byKategori: PengeluaranSummaryByKategori[];
  byMetode: PengeluaranSummaryByMetode[];
}

export interface ScheduleRecap {
  id: string;
  tanggal: string;
  shift: string;
  lokasi: string;
  penanggungJawab: string;
  status: 'Selesai' | 'Tertunda' | 'Batal';
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
export type DriverAttendanceStatus = AttendanceStatus | 'Full GW + Deliv' | 'Full GW No Deliv' | 'GW Setengah';

export interface Employee {
  id: string;
  name: string;
  role: 'Admin' | 'Driver';
}

export interface AttendanceRecord {
  id: string;
  tanggal: string;
  employeeId: string;
  employeeName: string;
  role: 'Admin' | 'Driver';
  kehadiran: DriverAttendanceStatus;
  keterangan?: string;
  partnerId?: string;
  partnerName?: string;
  createdAt: string;
}

export interface ScheduleEmployee {
  id: string;
  name: string;
  role: 'Admin' | 'Driver';
}

export interface ScheduleAttendanceApi {
  id: string;
  tanggal: string;
  employeeId: string;
  attendanceStatus: string;
  keterangan?: string | null;
  partnerId?: string | null;
  partner?: ScheduleEmployee | null;
  employee: ScheduleEmployee;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRate {
  id: string;
  month: string;
  adminBase: number;
  driverBase: number;
  makan: number;
  awb: number;
  gw: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollHistory {
  id: string;
  month: string;
  employeeId: string;
  employeeName: string;
  role: 'Admin' | 'Driver';
  hadirCount: number;
  basePay: number;
  makanPay: number;
  bonusManual: number;
  awbBonus: number;
  gwBonus: number;
  bonusTotal: number;
  kasbonAmount: number;
  grossPay: number;
  netPay: number;
  createdAt: string;
  updatedAt: string;
}
