import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

interface ActivityTypeInfo {
  type: string;
  count: number;
  icon: string;
}

const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  'rekapan.create': '📦',
  'rekapan.update': '✏️',
  'rekapan.delete': '🗑️',
  'rekapan_internal.create': '📋',
  'rekapan_internal.update': '✏️',
  'rekapan_internal.delete': '🗑️',
  'rekapan_internal.import': '📥',
  'kasbon.create': '💵',
  'kasbon.update': '💵',
  'kasbon.delete': '🗑️',
  'pengeluaran.create': '💰',
  'pengeluaran.update': '💰',
  'pengeluaran.delete': '🗑️',
  'schedule.attendance.create': '✅',
  'schedule.attendance.update': '✏️',
  'schedule.attendance.delete': '🗑️',
};

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const period = (url.searchParams.get('period') ?? 'daily') as 'daily' | 'weekly' | 'monthly';

    // Calculate date range based on period
    let startDate: Date;
    if (period === 'daily') {
      startDate = dayjs().startOf('day').toDate();
    } else if (period === 'weekly') {
      startDate = dayjs().subtract(7, 'day').startOf('day').toDate();
    } else {
      // monthly
      startDate = dayjs().subtract(30, 'day').startOf('day').toDate();
    }

    const now = new Date();

    // Total logs
    const totalLogs = await prisma.activityLog.count();

    // Today's logs
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const todayLogs = await prisma.activityLog.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Unread logs
    const unreadLogs = await prisma.activityLog.count({
      where: {
        read: false,
      },
    });

    // Top activity types (in period)
    const allLogs = await prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        type: true,
      },
    });

    const typeCountMap: Record<string, number> = {};
    for (const log of allLogs) {
      typeCountMap[log.type] = (typeCountMap[log.type] ?? 0) + 1;
    }

    const topActivityTypes: ActivityTypeInfo[] = Object.entries(typeCountMap)
      .map(([type, count]) => ({
        type,
        count,
        icon: ACTIVITY_TYPE_ICONS[type] ?? '📝',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top users (in period)
    const userCountMap: Record<string, number> = {};
    for (const log of allLogs) {
      if (log.type) {
        // We need to fetch user info from details if available
        // For now, we'll count by activity type
      }
    }

    const topUserLogs = await prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        user: true,
      },
    });

    const userCountMap2: Record<string, number> = {};
    for (const log of topUserLogs) {
      const user = log.user ?? '(Unknown)';
      userCountMap2[user] = (userCountMap2[user] ?? 0) + 1;
    }

    const topUsers = Object.entries(userCountMap2)
      .map(([user, count]) => ({
        user,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return jsonResponse({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        unreadLogs,
        topActivityTypes,
        topUsers,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    return errorResponse('Gagal mengambil statistik activity logs', 500, String(error));
  }
}
