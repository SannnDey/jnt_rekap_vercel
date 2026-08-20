import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { ScheduleAttendanceIdSchema, UpdateScheduleAttendanceSchema } from '@/lib/zod-schemas';

const attendanceStatusMap: Record<string, string> = {
  Hadir: 'Hadir',
  Sakit: 'Sakit',
  Izin: 'Izin',
  Alpha: 'Alpha',
  'Full GW + Deliv': 'Full_GW_Deliv',
  'Full GW No Deliv': 'Full_GW_No_Deliv',
  'GW Setengah': 'GW_Setengah',
};

const normalizeAttendanceStatus = (status: string) => {
  return attendanceStatusMap[status] ?? status;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = ScheduleAttendanceIdSchema.parse({ id: params.id });
    const attendance = await prisma.scheduleAttendance.findUnique({
      where: { id },
      include: { employee: true, partner: true },
    });
    if (!attendance) return errorResponse('Data kehadiran tidak ditemukan', 404);
    return jsonResponse({ success: true, message: 'Data kehadiran berhasil diambil', data: attendance, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil data kehadiran', 400, String(error));
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = ScheduleAttendanceIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validated = UpdateScheduleAttendanceSchema.parse(body);

    const existing = await prisma.scheduleAttendance.findUnique({ where: { id }, include: { employee: true } });
    if (!existing) return errorResponse('Data kehadiran tidak ditemukan', 404);

    const updated = await prisma.scheduleAttendance.update({
      where: { id },
      data: {
        tanggal: validated.tanggal ?? existing.tanggal,
        employeeId: validated.employeeId ?? existing.employeeId,
        attendanceStatus:
          validated.attendanceStatus !== undefined
            ? (normalizeAttendanceStatus(validated.attendanceStatus) as any)
            : existing.attendanceStatus,
        keterangan: validated.keterangan !== undefined ? validated.keterangan : existing.keterangan,
        partnerId: validated.partnerId !== undefined ? validated.partnerId : existing.partnerId,
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
      const employeeName = existing.employee?.name ?? 'Unknown';
      const createdLog = await prisma.activityLog.create({ data: { type: 'schedule.attendance.update', details: JSON.stringify({ id: updated.id, employeeName, changes }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }

    return jsonResponse({ success: true, message: 'Data kehadiran berhasil diperbarui', data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal memperbarui data kehadiran', 400, String(error));
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = ScheduleAttendanceIdSchema.parse({ id: params.id });
    const existing = await prisma.scheduleAttendance.findUnique({ where: { id }, include: { employee: true } });
    if (!existing) return errorResponse('Data kehadiran tidak ditemukan', 404);
    await prisma.scheduleAttendance.delete({ where: { id } });
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const employeeName = existing.employee?.name ?? 'Unknown';
      const createdLog = await prisma.activityLog.create({ data: { type: 'schedule.attendance.delete', details: JSON.stringify({ id: existing.id, employeeName, tanggal: existing.tanggal }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }
    return jsonResponse({ success: true, message: 'Data kehadiran berhasil dihapus', data: existing, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menghapus data kehadiran', 400, String(error));
  }
}
