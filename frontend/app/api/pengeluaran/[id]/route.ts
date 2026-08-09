import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { RekapanOutgoingIdSchema, UpdatePengeluaranSchema } from '@/lib/zod-schemas';

const roundToNumber = (value: number) => Math.round(value);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const item = await prisma.pengeluaran.findUnique({ where: { id } });
    if (!item) return errorResponse('Pengeluaran tidak ditemukan', 404);
    return jsonResponse({ success: true, message: 'Data pengeluaran berhasil diambil', data: item, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil pengeluaran', 400, String(error));
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validated = UpdatePengeluaranSchema.parse(body);

    const existing = await prisma.pengeluaran.findUnique({ where: { id } });
    if (!existing) return errorResponse('Pengeluaran tidak ditemukan', 404);

    const updated = await prisma.pengeluaran.update({
      where: { id },
      data: {
        tanggal: validated.tanggal ?? existing.tanggal,
        jenis: validated.jenis ?? existing.jenis,
        nominal: validated.nominal !== undefined ? roundToNumber(validated.nominal) : existing.nominal,
        metodePembayaran: validated.metodePembayaran ?? existing.metodePembayaran,
        kategori: validated.kategori ?? existing.kategori,
        tipeKendaraan: validated.tipeKendaraan !== undefined ? validated.tipeKendaraan : existing.tipeKendaraan,
        jenisBahanBakar: validated.jenisBahanBakar !== undefined ? validated.jenisBahanBakar : existing.jenisBahanBakar,
        liter: validated.liter !== undefined ? validated.liter : existing.liter,
        km: validated.km !== undefined ? validated.km : existing.km,
      },
    });

    return jsonResponse({ success: true, message: 'Pengeluaran berhasil diperbarui', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal memperbarui pengeluaran', 400, String(error));
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const existing = await prisma.pengeluaran.findUnique({ where: { id } });
    if (!existing) return errorResponse('Pengeluaran tidak ditemukan', 404);
    await prisma.pengeluaran.delete({ where: { id } });
    return jsonResponse({ success: true, message: 'Pengeluaran berhasil dihapus', data: existing, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menghapus pengeluaran', 400, String(error));
  }
}
