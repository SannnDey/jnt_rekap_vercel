import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? '50')));
    const skip = (page - 1) * limit;
    const type = url.searchParams.get('type') ?? undefined;
    const user = url.searchParams.get('user') ?? undefined;
    const search = url.searchParams.get('search') ?? undefined;
    const unread = url.searchParams.get('unread');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const where: any = {};
    if (type) where.type = { contains: type };
    if (user) where.user = { contains: user };
    if (unread === '1' || unread === 'true') where.read = { equals: false };
    if (search) {
      where.OR = [
        { type: { contains: search } },
        { details: { contains: search } },
        { user: { contains: search } },
      ];
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const startDate = dayjs(dateFrom).startOf('day').toDate();
        where.createdAt.gte = startDate;
      }
      if (dateTo) {
        const endDate = dayjs(dateTo).endOf('day').toDate();
        where.createdAt.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.activityLog.count({ where }),
    ]);

    return jsonResponse({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil activity logs', 500, String(error));
  }
}
