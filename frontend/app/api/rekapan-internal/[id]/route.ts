import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { CreateRekapanInternalSchema, UpdateRekapanInternalSchema, RekapanInternalIdSchema } from '@/lib/zod-schemas';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanInternalIdSchema.parse({ id: params.id });
    const rekapan = await prisma.rekapanInternal.findUnique({ where: { id } });
    if (!rekapan) return errorResponse('Rekapan internal tidak ditemukan', 404);
    return jsonResponse({ success: true, message: 'Data rekapan internal berhasil diambil', data: rekapan, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil rekapan internal', 400, String(error));
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanInternalIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validated = UpdateRekapanInternalSchema.parse(body);

    const existing = await prisma.rekapanInternal.findUnique({ where: { id } });
    if (!existing) return errorResponse('Rekapan internal tidak ditemukan', 404);

    const sanitized: any = {
      ...validated,
      ...(validated.jumlahKoli !== undefined ? { jumlahKoli: Math.round(validated.jumlahKoli) } : {}),
      ...(validated.jumlahPembayaranCOD !== undefined ? { jumlahPembayaranCOD: Math.round(validated.jumlahPembayaranCOD) } : {}),
      ...(validated.biayaDFOD !== undefined ? { biayaDFOD: Math.round(validated.biayaDFOD) } : {}),
    };

    const updated = await prisma.rekapanInternal.update({ where: { id }, data: sanitized });
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const { computeFieldChanges } = await import('@/lib/utils');
      const changes = computeFieldChanges(existing as any, sanitized as any);
      const createdLog = await prisma.activityLog.create({ data: { type: 'rekapan_internal.update', details: JSON.stringify({ id: updated.id, waybill: updated.waybill, changes }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }
    return jsonResponse({ success: true, message: 'Rekapan internal berhasil diperbarui', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal memperbarui rekapan internal', 400, String(error));
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = RekapanInternalIdSchema.parse({ id: params.id });
    const existing = await prisma.rekapanInternal.findUnique({ where: { id } });
    if (!existing) return errorResponse('Rekapan internal tidak ditemukan', 404);
    await prisma.rekapanInternal.delete({ where: { id } });
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const createdLog = await prisma.activityLog.create({ data: { type: 'rekapan_internal.delete', details: JSON.stringify({ id: existing.id, waybill: existing.waybill }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }
    return jsonResponse({ success: true, message: 'Rekapan internal berhasil dihapus', data: existing, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menghapus rekapan internal', 400, String(error));
  }
}
