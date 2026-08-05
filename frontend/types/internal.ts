export interface RekapanInternalRecord {
  id: string;
  tanggalRekap: string;
  waybill: string;
  sprinterDelivery: string;
  jumlahKoli: number;
  jumlahPembayaranCOD: number;
  biayaDFOD: number;
  createdAt: string;
  updatedAt: string;
}

export interface RekapanInternalSummary {
  totalAwb: number;
  totalKoli: number;
  totalCOD: number;
  totalDFOD: number;
  bySprinter: Array<{
    sprinterDelivery: string;
    countAwb: number;
    totalKoli: number;
    totalCOD: number;
    totalDFOD: number;
  }>;
}

export interface CreateRekapanInternalInput {
  tanggalRekap: string;
  waybill: string;
  sprinterDelivery: string;
  jumlahKoli: number;
  jumlahPembayaranCOD: number;
  biayaDFOD: number;
}

export interface UpdateRekapanInternalInput {
  tanggalRekap?: string;
  waybill?: string;
  sprinterDelivery?: string;
  jumlahKoli?: number;
  jumlahPembayaranCOD?: number;
  biayaDFOD?: number;
}
