import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
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

    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const { computeFieldChanges } = await import('@/lib/utils');
      const changes = computeFieldChanges(existing as any, validated as any);
      const createdLog = await prisma.activityLog.create({ data: { type: 'kasbon.update', details: JSON.stringify({ id: updated.id, employee: updated.employee, amount: updated.amount, changes }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }

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
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const createdLog = await prisma.activityLog.create({ data: { type: 'kasbon.delete', details: JSON.stringify({ id: existing.id, employee: existing.employee, amount: existing.amount }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }
    return jsonResponse({ success: true, message: 'Kasbon berhasil dihapus', data: existing, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menghapus kasbon', 400, String(error));
  }
}
