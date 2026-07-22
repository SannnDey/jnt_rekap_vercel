export enum MetodePembayaran {
  TRANSFER = 'TRANSFER',
  CASH = 'CASH',
  TF_CASH = 'TF_CASH',
  PICKUP_ONLINE = 'PICKUP_ONLINE',
  BULANAN = 'BULANAN',
}

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
  }>;
}
