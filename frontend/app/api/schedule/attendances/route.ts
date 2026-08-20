import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { buildDateRangeFilter } from '@/lib/api-route-utils';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const employeeId = url.searchParams.get('employeeId');
    const role = url.searchParams.get('role');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (role) where.employee = { role };
    const dateFilter = buildDateRangeFilter(startDate, endDate, 'tanggal');
    if (dateFilter) Object.assign(where, dateFilter);

    const attendances = await prisma.scheduleAttendance.findMany({
      where,
      orderBy: { tanggal: 'desc' },
      include: { employee: true, partner: true },
    });

    const attendanceStatusLabel: Record<string, string> = {
      Hadir: 'Hadir',
      Sakit: 'Sakit',
      Izin: 'Izin',
      Alpha: 'Alpha',
      Full_GW_Deliv: 'Full GW + Deliv',
      Full_GW_No_Deliv: 'Full GW No Deliv',
      GW_Setengah: 'GW Setengah',
    };

    const normalize = (rec: any) => ({
      ...rec,
      attendanceStatus: attendanceStatusLabel[rec.attendanceStatus] ?? rec.attendanceStatus,
    });

    return jsonResponse({ success: true, message: 'Data kehadiran berhasil diambil', data: attendances.map(normalize), timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil data kehadiran', 500, String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tanggal, employeeId, attendanceStatus, keterangan, partnerId } = body;
    if (!tanggal || !employeeId || !attendanceStatus) {
      return errorResponse('tanggal, employeeId, dan attendanceStatus wajib diisi', 400);
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return errorResponse('Karyawan tidak ditemukan', 404);

    // disallow Full statuses for Admin role (only drivers can have Full GW)
    if (employee.role === 'Admin' && String(attendanceStatus).startsWith('Full')) {
      return errorResponse('Status Full GW hanya berlaku untuk driver', 400);
    }

    if (partnerId) {
      const partner = await prisma.employee.findUnique({ where: { id: partnerId } });
      if (!partner || partner.role !== 'Driver') {
        return errorResponse('Partner harus karyawan dengan jabatan Driver', 400);
      }
    }

    const attendanceStatusMap: Record<string, string> = {
      Hadir: 'Hadir',
      Sakit: 'Sakit',
      Izin: 'Izin',
      Alpha: 'Alpha',
      'Full GW + Deliv': 'Full_GW_Deliv',
      'Full GW No Deliv': 'Full_GW_No_Deliv',
      'GW Setengah': 'GW_Setengah',
    };

    const mapped = attendanceStatusMap[attendanceStatus];
    if (!mapped) return errorResponse('Status kehadiran tidak valid', 400);

    const attendance = await prisma.scheduleAttendance.create({
      data: {
        tanggal: new Date(String(tanggal)),
        employeeId,
        attendanceStatus: mapped as any,
        keterangan: keterangan ?? null,
        partnerId: partnerId ?? null,
      },
    });

    // normalize for response
    const attendanceStatusLabel: Record<string, string> = {
      Hadir: 'Hadir',
      Sakit: 'Sakit',
      Izin: 'Izin',
      Alpha: 'Alpha',
      Full_GW_Deliv: 'Full GW + Deliv',
      Full_GW_No_Deliv: 'Full GW No Deliv',
      GW_Setengah: 'GW Setengah',
    };

    const normalize = (rec: any) => ({
      ...rec,
      attendanceStatus: attendanceStatusLabel[rec.attendanceStatus] ?? rec.attendanceStatus,
    });

    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const createdLog = await prisma.activityLog.create({ data: { type: 'schedule.attendance.create', details: JSON.stringify({ id: attendance.id, employeeName: employee.name, tanggal: attendance.tanggal }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }

    return jsonResponse({ success: true, message: 'Rekap kehadiran berhasil disimpan', data: normalize(attendance), timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal menyimpan kehadiran', 400, String(error));
  }
}
