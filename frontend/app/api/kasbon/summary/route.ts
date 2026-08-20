import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { buildDateRangeFilter } from '@/lib/api-route-utils';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};
    const dateFilter = buildDateRangeFilter(startDate, endDate, 'tanggal');
    if (dateFilter) Object.assign(where, dateFilter);

    const [grouped, total] = await Promise.all([
      prisma.kasbon.groupBy({
        by: ['employee'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.kasbon.aggregate({
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return jsonResponse({
      success: true,
      message: 'Kasbon summary berhasil diambil',
      data: {
        totalCount: total._count._all || 0,
        totalAmount: total._sum.amount || 0,
        byEmployee: grouped.map((item) => ({
          employee: item.employee,
          count: item._count._all,
          totalAmount: item._sum.amount || 0,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil kasbon summary', 500, String(error));
  }
}
