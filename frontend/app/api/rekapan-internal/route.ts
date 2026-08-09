import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { CreateRekapanInternalSchema } from '@/lib/zod-schemas';
import { buildDateRangeFilter } from '@/lib/api-route-utils';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc';
    const all = String(url.searchParams.get('all') ?? '').toLowerCase() === 'true';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(10000, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { waybill: { contains: search } },
        { sprinterDelivery: { contains: search } },
      ];
    }

    const dateFilter = buildDateRangeFilter(startDate, endDate, 'tanggalRekap');
    if (dateFilter) {
      Object.assign(where, dateFilter);
    }

    const allowedSort = ['tanggalRekap', 'createdAt', 'waybill', 'jumlahKoli', 'jumlahPembayaranCOD', 'biayaDFOD'];
    const orderByField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [orderByField]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' };

    let data: any[] = [];
    let total = 0;

    if (all) {
      data = await prisma.rekapanInternal.findMany({ where, orderBy });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prisma.rekapanInternal.findMany({ where, skip, take: limitNum, orderBy }),
        prisma.rekapanInternal.count({ where }),
      ]);
    }

    return jsonResponse({
      success: true,
      message: 'Data rekapan internal berhasil diambil',
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
    return errorResponse('Gagal mengambil data rekapan internal', 500, String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateRekapanInternalSchema.parse(body);

    const sanitized = {
      ...validated,
      jumlahKoli: Math.round(validated.jumlahKoli),
      jumlahPembayaranCOD: Math.round(validated.jumlahPembayaranCOD),
      biayaDFOD: Math.round(validated.biayaDFOD),
    };

    const rekapan = await prisma.rekapanInternal.create({ data: sanitized });

    return jsonResponse({
      success: true,
      message: 'Rekapan internal berhasil dibuat',
      data: rekapan,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    return errorResponse('Gagal membuat rekapan internal', 400, String(error));
  }
}
