import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids = body.ids ?? [];
    const olderThanDays = body.olderThanDays ?? null;
    const beforeDate = body.beforeDate ?? null;

    let deletedCount = 0;

    // Delete by specific IDs
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.activityLog.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      deletedCount = result.count;
    }
    // Delete older than X days
    else if (olderThanDays && typeof olderThanDays === 'number' && olderThanDays > 0) {
      const cutoffDate = dayjs().subtract(olderThanDays, 'day').startOf('day').toDate();
      const result = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      deletedCount = result.count;
    }
    // Delete before specific date
    else if (beforeDate) {
      const cutoffDate = dayjs(beforeDate).endOf('day').toDate();
      const result = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lte: cutoffDate,
          },
        },
      });
      deletedCount = result.count;
    } else {
      return errorResponse('Harus menyediakan ids, olderThanDays, atau beforeDate', 400);
    }

    return jsonResponse({
      success: true,
      message: `Berhasil menghapus ${deletedCount} activity log`,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Delete activity logs error:', error);
    return errorResponse('Gagal menghapus activity logs', 500, String(error));
  }
}
