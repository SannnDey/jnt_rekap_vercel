import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const month = request.nextUrl.searchParams.get('month');

    if (!month) {
      return jsonResponse({
        success: true,
        message: 'Month query parameter tidak diberikan',
        data: null,
        timestamp: new Date().toISOString(),
      });
    }

    const payrollRate = await prisma.payrollRate.findUnique({
      where: { month },
    });

    return jsonResponse({
      success: true,
      message: 'Tarif payroll berhasil diambil',
      data: payrollRate ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil tarif payroll', 500, String(error));
  }
}
