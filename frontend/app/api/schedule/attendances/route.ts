import { NextRequest } from 'next/server';
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

    return jsonResponse({ success: true, message: 'Data kehadiran berhasil diambil', data: attendances, timestamp: new Date().toISOString() });
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

    const attendance = await prisma.scheduleAttendance.create({
      data: {
        tanggal: new Date(String(tanggal)),
        employeeId,
        attendanceStatus: attendanceStatus as any,
        keterangan: keterangan ?? null,
        partnerId: partnerId ?? null,
      },
    });

    return jsonResponse({ success: true, message: 'Rekap kehadiran berhasil disimpan', data: attendance, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal menyimpan kehadiran', 400, String(error));
  }
}
