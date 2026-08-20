import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { RekapanOutgoingIdSchema, UpdateRekapanOutgoingSchema } from '@/lib/zod-schemas';

const roundToThree = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;
const calculateTotal = (ongkir: number, asuransi: number, packing: number) => ongkir + asuransi + packing;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const rekapan = await prisma.rekapanOutgoing.findUnique({ where: { id } });
    if (!rekapan) return errorResponse('Rekapan tidak ditemukan', 404);
    return jsonResponse({ success: true, message: 'Rekapan berhasil diambil', data: rekapan, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil rekapan', 400, String(error));
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validated = UpdateRekapanOutgoingSchema.parse(body);

    const existing = await prisma.rekapanOutgoing.findUnique({ where: { id } });
    if (!existing) return errorResponse('Rekapan tidak ditemukan', 404);

    const dataToUpdate: any = { ...validated };
    if (dataToUpdate.jumlahKoli !== undefined) dataToUpdate.jumlahKoli = Math.round(dataToUpdate.jumlahKoli);
    if (dataToUpdate.beratKg !== undefined) dataToUpdate.beratKg = roundToThree(dataToUpdate.beratKg);
    if (dataToUpdate.ongkir !== undefined) dataToUpdate.ongkir = Math.round(dataToUpdate.ongkir);
    if (dataToUpdate.asuransi !== undefined) dataToUpdate.asuransi = Math.round(dataToUpdate.asuransi);
    if (dataToUpdate.packing !== undefined) dataToUpdate.packing = Math.round(dataToUpdate.packing);

    if (validated.ongkir !== undefined || validated.asuransi !== undefined || validated.packing !== undefined) {
      const ongkir = validated.ongkir ?? existing.ongkir;
      const asuransi = validated.asuransi ?? existing.asuransi;
      const packing = validated.packing ?? existing.packing;
      dataToUpdate.total = calculateTotal(ongkir, asuransi, packing);
    }

    const updated = await prisma.rekapanOutgoing.update({ where: { id }, data: dataToUpdate });
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const { computeFieldChanges } = await import('@/lib/utils');
      const changes = computeFieldChanges(existing as any, dataToUpdate as any);
      const createdLog = await prisma.activityLog.create({ data: { type: 'rekapan.update', details: JSON.stringify({ id: updated.id, waybill: updated.waybill ?? existing.waybill, changes }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }

    return jsonResponse({ success: true, message: 'Rekapan berhasil diperbarui', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal memperbarui rekapan', 400, String(error));
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanOutgoingIdSchema.parse({ id: params.id });
    const rekapan = await prisma.rekapanOutgoing.findUnique({ where: { id } });
    if (!rekapan) return errorResponse('Rekapan tidak ditemukan', 404);
    await prisma.rekapanOutgoing.delete({ where: { id } });
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const createdLog = await prisma.activityLog.create({ data: { type: 'rekapan.delete', details: JSON.stringify({ id: rekapan.id, waybill: rekapan.waybill }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }

    return jsonResponse({ success: true, message: 'Rekapan berhasil dihapus', data: rekapan, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menghapus rekapan', 400, String(error));
  }
}
