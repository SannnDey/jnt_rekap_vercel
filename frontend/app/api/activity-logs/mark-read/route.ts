import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined;

    let result;
    if (ids && ids.length > 0) {
      result = await prisma.activityLog.updateMany({ where: { id: { in: ids } }, data: { read: true } });
    } else {
      result = await prisma.activityLog.updateMany({ where: { read: false }, data: { read: true } });
    }

    return jsonResponse({ success: true, updated: result.count, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menandai activity logs sebagai dibaca', 500, String(error));
  }
}
