import { NextRequest } from 'next/server';
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
    return jsonResponse({ success: true, message: 'Karyawan berhasil ditambahkan', data: employee, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal membuat karyawan', 400, String(error));
  }
}
