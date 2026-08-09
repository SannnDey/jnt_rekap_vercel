import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { RekapanOutgoingIdSchema, UpdateKasbonSchema } from '@/lib/zod-schemas';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const kasbon = await prisma.kasbon.findUnique({ where: { id } });
    if (!kasbon) return errorResponse('Kasbon tidak ditemukan', 404);
    return jsonResponse({ success: true, message: 'Data kasbon berhasil diambil', data: kasbon, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil kasbon', 400, String(error));
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validated = UpdateKasbonSchema.parse(body);

    const existing = await prisma.kasbon.findUnique({ where: { id } });
    if (!existing) return errorResponse('Kasbon tidak ditemukan', 404);

    const updated = await prisma.kasbon.update({
      where: { id },
      data: {
        employee: validated.employee ?? existing.employee,
        tanggal: validated.tanggal ?? existing.tanggal,
        amount: validated.amount !== undefined ? Math.round(validated.amount) : existing.amount,
        description: validated.description !== undefined ? validated.description : existing.description,
        settled: validated.settled !== undefined ? validated.settled : existing.settled,
      },
    });

    return jsonResponse({ success: true, message: 'Kasbon berhasil diperbarui', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal memperbarui kasbon', 400, String(error));
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const existing = await prisma.kasbon.findUnique({ where: { id } });
    if (!existing) return errorResponse('Kasbon tidak ditemukan', 404);
    await prisma.kasbon.delete({ where: { id } });
    return jsonResponse({ success: true, message: 'Kasbon berhasil dihapus', data: existing, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menghapus kasbon', 400, String(error));
  }
}
