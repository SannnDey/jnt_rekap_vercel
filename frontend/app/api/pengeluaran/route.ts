import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { buildDateRangeFilter } from '@/lib/api-route-utils';
import { CreatePengeluaranSchema } from '@/lib/zod-schemas';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const kategori = url.searchParams.get('kategori');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const all = String(url.searchParams.get('all') ?? '').toLowerCase() === 'true';

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(10000, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (kategori) where.kategori = { equals: kategori };
    const dateFilter = buildDateRangeFilter(startDate, endDate, 'tanggal');
    if (dateFilter) Object.assign(where, dateFilter);

    let data: any[] = [];
    let total = 0;

    if (all) {
      data = await prisma.pengeluaran.findMany({ where, orderBy: { tanggal: 'desc' } });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prisma.pengeluaran.findMany({ where, skip, take: limitNum, orderBy: { tanggal: 'desc' } }),
        prisma.pengeluaran.count({ where }),
      ]);
    }

    return jsonResponse({
      success: true,
      message: 'Data pengeluaran berhasil diambil',
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil data pengeluaran', 500, String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreatePengeluaranSchema.parse(body);

    const pengeluaran = await prisma.pengeluaran.create({
      data: {
        tanggal: validated.tanggal,
        jenis: validated.jenis,
        nominal: Math.round(validated.nominal),
        metodePembayaran: validated.metodePembayaran,
        kategori: validated.kategori,
        tipeKendaraan: validated.tipeKendaraan ?? undefined,
        jenisBahanBakar: validated.jenisBahanBakar ?? undefined,
        liter: validated.liter ?? undefined,
        km: validated.km ?? undefined,
      },
    });

    return jsonResponse({ success: true, message: 'Pengeluaran berhasil dibuat', data: pengeluaran, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal membuat pengeluaran', 400, String(error));
  }
}
