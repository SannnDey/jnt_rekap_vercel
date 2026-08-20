import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { buildDateRangeFilter } from '@/lib/api-route-utils';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const kategori = url.searchParams.get('kategori');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};
    if (kategori) where.kategori = kategori;
    const dateFilter = buildDateRangeFilter(startDate, endDate, 'tanggal');
    if (dateFilter) Object.assign(where, dateFilter);

    const [totalAgg, byKategori, byMetode] = await Promise.all([
      prisma.pengeluaran.aggregate({
        where,
        _sum: { nominal: true },
        _count: { _all: true },
      }),
      prisma.pengeluaran.groupBy({
        by: ['kategori'],
        where,
        _sum: { nominal: true },
        _count: { _all: true },
      }),
      prisma.pengeluaran.groupBy({
        by: ['metodePembayaran'],
        where,
        _sum: { nominal: true },
        _count: { _all: true },
      }),
    ]);

    return jsonResponse({
      success: true,
      message: 'Pengeluaran summary berhasil diambil',
      data: {
        totalCount: totalAgg._count._all || 0,
        totalNominal: totalAgg._sum.nominal || 0,
        byKategori: byKategori.map((item) => ({ kategori: item.kategori, count: item._count._all, total: item._sum.nominal || 0 })),
        byMetode: byMetode.map((item) => ({ metode: item.metodePembayaran, count: item._count._all, total: item._sum.nominal || 0 })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil pengeluaran summary', 500, String(error));
  }
}
