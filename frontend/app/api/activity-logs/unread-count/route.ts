import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const unread = await prisma.activityLog.count({ where: { read: false } });
    return jsonResponse({ success: true, unread, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal mengambil unread count', 500, String(error));
  }
}
