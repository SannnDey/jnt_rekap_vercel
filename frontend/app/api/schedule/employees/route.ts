import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { CreateEmployeeSchema } from '@/lib/zod-schemas';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
    return jsonResponse({ success: true, message: 'Daftar karyawan berhasil diambil', data: employees, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil daftar karyawan', 500, String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateEmployeeSchema.parse(body);
    const employee = await prisma.employee.create({ data: validated });
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const createdLog = await prisma.activityLog.create({ data: { type: 'schedule.employee.create', details: JSON.stringify({ id: employee.id, name: employee.name, role: employee.role }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }
    return jsonResponse({ success: true, message: 'Karyawan berhasil ditambahkan', data: employee, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal membuat karyawan', 400, String(error));
  }
}
