import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

const parseLocalDate = (value: string, endOfDay = false): Date => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) throw new Error(`Invalid date format: ${value}`);
  const date = new Date(year, month - 1, day);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
};

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where: any = {};
    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
          ? parseLocalDate(startDate)
          : new Date(startDate);
      }
      if (endDate) {
        where.tanggal.lte = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
          ? parseLocalDate(endDate, true)
          : new Date(endDate);
      }
    }

    const [totalCount, totalAgg, byMethod, dfodAgg, nonDfodAgg] = await Promise.all([
      prisma.rekapanOutgoing.count({ where }),
      prisma.rekapanOutgoing.aggregate({
        where,
        _sum: {
          total: true,
          jumlahKoli: true,
          beratKg: true,
          ongkir: true,
          asuransi: true,
          packing: true,
        },
        _avg: {
          beratKg: true,
        },
      }),
      prisma.rekapanOutgoing.groupBy({
        by: ['metodePembayaran'],
        where,
        _count: true,
        _sum: {
          total: true,
          ongkir: true,
          asuransi: true,
          packing: true,
        },
      }),
      prisma.rekapanOutgoing.aggregate({
        where: { ...where, metodePembayaran: 'DFOD' as any },
        _sum: { total: true, ongkir: true, asuransi: true, packing: true },
      }),
      prisma.rekapanOutgoing.aggregate({
        where: { ...where, metodePembayaran: { not: 'DFOD' } as any },
        _sum: { total: true, ongkir: true, asuransi: true, packing: true },
      }),
    ]);

    return jsonResponse({
      success: true,
      message: 'Summary rekapan berhasil diambil',
      data: {
        totalCount,
        totalAmount: totalAgg._sum.total || 0,
        totalOngkir: totalAgg._sum.ongkir || 0,
        totalAsuransi: totalAgg._sum.asuransi || 0,
        totalPacking: totalAgg._sum.packing || 0,
        totalKoli: totalAgg._sum.jumlahKoli || 0,
        totalWeight: totalAgg._sum.beratKg || 0,
        averageWeight: totalAgg._avg.beratKg || 0,
        byMethod: byMethod.map((item) => ({
          method: item.metodePembayaran,
          count: item._count,
          total: item._sum.total || 0,
          totalOngkir: item._sum.ongkir || 0,
          totalAsuransi: item._sum.asuransi || 0,
          totalPacking: item._sum.packing || 0,
        })),
        totalOngkirDFOD: dfodAgg._sum.ongkir || 0,
        totalAsuransiDFOD: dfodAgg._sum.asuransi || 0,
        totalPackingDFOD: dfodAgg._sum.packing || 0,
        totalAmountDFOD: dfodAgg._sum.total || 0,
        totalOngkirNonDFOD: nonDfodAgg._sum.ongkir || 0,
        totalAsuransiNonDFOD: nonDfodAgg._sum.asuransi || 0,
        totalPackingNonDFOD: nonDfodAgg._sum.packing || 0,
        totalAmountNonDFOD: nonDfodAgg._sum.total || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil summary rekapan', 500, String(error));
  }
}
