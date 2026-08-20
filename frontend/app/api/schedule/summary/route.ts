import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const total = await prisma.scheduleAttendance.count();
    const byRole = await prisma.scheduleAttendance.groupBy({
      by: ['employeeId'],
      _count: { _all: true },
    });
    const statusCounts = await prisma.scheduleAttendance.groupBy({
      by: ['attendanceStatus'],
      _count: { _all: true },
    });

    const employeeDetails = await prisma.employee.findMany();
    const roleMap = employeeDetails.reduce<Record<string, string>>((acc, employee) => {
      acc[employee.id] = employee.role;
      return acc;
    }, {});

    return jsonResponse({
      success: true,
      message: 'Ringkasan schedule berhasil diambil',
      data: {
        total,
        byRole: byRole.map((row) => ({ employeeId: row.employeeId, role: roleMap[row.employeeId] ?? 'Unknown', count: row._count._all })),
        byStatus: statusCounts.map((row) => ({ status: row.attendanceStatus, count: row._count._all })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil summary schedule', 500, String(error));
  }
}
