import { z } from 'zod';

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

export type CreateRekapanInternalInput = z.infer<typeof CreateRekapanInternalSchema>;
export type UpdateRekapanInternalInput = z.infer<typeof UpdateRekapanInternalSchema>;
export type RekapanInternalIdInput = z.infer<typeof RekapanInternalIdSchema>;
