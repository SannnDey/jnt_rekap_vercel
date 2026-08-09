import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { buildDateRangeFilter } from '@/lib/api-route-utils';
import { CreateKasbonSchema } from '@/lib/zod-schemas';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const employee = url.searchParams.get('employee');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const all = String(url.searchParams.get('all') ?? '').toLowerCase() === 'true';

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(10000, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (employee) where.employee = { equals: employee };
    const dateFilter = buildDateRangeFilter(startDate, endDate, 'tanggal');
    if (dateFilter) Object.assign(where, dateFilter);

    let data: any[] = [];
    let total = 0;

    if (all) {
      data = await prisma.kasbon.findMany({ where, orderBy: { tanggal: 'desc' } });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prisma.kasbon.findMany({ where, skip, take: limitNum, orderBy: { tanggal: 'desc' } }),
        prisma.kasbon.count({ where }),
      ]);
    }

    return jsonResponse({
      success: true,
      message: 'Data kasbon berhasil diambil',
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
    return errorResponse('Gagal mengambil data kasbon', 500, String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateKasbonSchema.parse(body);

    const kasbon = await prisma.kasbon.create({
      data: {
        employee: validated.employee,
        tanggal: validated.tanggal,
        amount: Math.round(validated.amount),
        description: validated.description ?? null,
        settled: validated.settled ?? false,
      },
    });

    return jsonResponse({ success: true, message: 'Kasbon berhasil dibuat', data: kasbon, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal membuat kasbon', 400, String(error));
  }
}
