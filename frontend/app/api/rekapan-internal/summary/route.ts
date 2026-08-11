import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { buildDateRangeFilter } from '@/lib/api-route-utils';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};
    const dateFilter = buildDateRangeFilter(startDate, endDate, 'tanggalRekap');
    if (dateFilter) Object.assign(where, dateFilter);

    const total = await prisma.rekapanInternal.aggregate({
      where,
      _count: { _all: true },
      _sum: { jumlahKoli: true, jumlahPembayaranCOD: true, biayaDFOD: true },
    });

    const bySprinter = await prisma.rekapanInternal.groupBy({
      by: ['sprinterDelivery'],
      where,
      _count: { _all: true },
      _sum: { jumlahKoli: true, jumlahPembayaranCOD: true, biayaDFOD: true },
    });

    return jsonResponse({
      success: true,
      message: 'Summary rekapan internal berhasil diambil',
      data: {
        totalAwb: total._count._all || 0,
        // keep totalCount for backward compatibility
        totalCount: total._count._all || 0,
        totalKoli: total._sum.jumlahKoli || 0,
        totalCOD: total._sum.jumlahPembayaranCOD || 0,
        totalDFOD: total._sum.biayaDFOD || 0,
        bySprinter: bySprinter.map((item) => ({
          sprinterDelivery: item.sprinterDelivery,
          countAwb: item._count._all,
          totalKoli: item._sum.jumlahKoli || 0,
          totalCOD: item._sum.jumlahPembayaranCOD || 0,
          totalDFOD: item._sum.biayaDFOD || 0,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil summary rekapan internal', 500, String(error));
  }
}
