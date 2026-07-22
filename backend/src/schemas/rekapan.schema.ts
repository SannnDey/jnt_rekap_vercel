import { z } from 'zod';

export const MetodePembayaranEnum = z.enum([
  'TRANSFER',
  'CASH',
  'TF_CASH',
  'PICKUP_ONLINE',
  'BULANAN',
]);

export const CreateRekapanOutgoingSchema = z.object({
  tanggal: z.coerce.date().describe('Tanggal pengiriman'),
  waybill: z
    .string()
    .min(1, 'Waybill harus diisi')
    .max(100, 'Waybill maksimal 100 karakter'),
  provinsi: z
    .string()
    .min(1, 'Provinsi harus diisi')
    .max(100, 'Provinsi maksimal 100 karakter'),
  jenisBarang: z
    .string()
    .min(1, 'Jenis barang harus diisi')
    .max(150, 'Jenis barang maksimal 150 karakter'),
  jumlahKoli: z
    .number()
    .int()
    .positive('Jumlah koli harus > 0'),
  beratKg: z
    .number()
    .positive('Berat harus > 0'),
  ongkir: z
    .number()
    .int()
    .min(0, 'Ongkir tidak boleh negatif'),
  asuransi: z
    .number()
    .int()
    .min(0, 'Asuransi tidak boleh negatif'),
  packing: z
    .number()
    .int()
    .min(0, 'Packing tidak boleh negatif'),
  metodePembayaran: MetodePembayaranEnum,
});

export const UpdateRekapanOutgoingSchema = CreateRekapanOutgoingSchema.partial();

export const RekapanOutgoingIdSchema = z.object({
  id: z.string().uuid('ID harus UUID valid'),
});

export type CreateRekapanOutgoingInput = z.infer<typeof CreateRekapanOutgoingSchema>;
export type UpdateRekapanOutgoingInput = z.infer<typeof UpdateRekapanOutgoingSchema>;
export type RekapanOutgoingIdInput = z.infer<typeof RekapanOutgoingIdSchema>;
