import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id;
    if (!id) return errorResponse('ID required', 400);
    const existing = await prisma.activityLog.findUnique({ where: { id } });
    if (!existing) return errorResponse('Activity not found', 404);
    await prisma.activityLog.update({ where: { id }, data: { details: null } });
    return jsonResponse({ success: true, message: 'Details cleared' });
  } catch (error) {
    return errorResponse('Failed to clear details', 500, String(error));
  }
}
