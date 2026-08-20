import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { CreateRekapanInternalSchema } from '@/lib/zod-schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const rowErrors: Array<{ rowIndex: number; errors: string[] }> = [];
    const validRows: any[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      try {
        const parsed = CreateRekapanInternalSchema.parse(rows[index]);
        validRows.push({
          ...parsed,
          jumlahKoli: Math.round(parsed.jumlahKoli),
          jumlahPembayaranCOD: Math.round(parsed.jumlahPembayaranCOD),
          biayaDFOD: Math.round(parsed.biayaDFOD),
        });
      } catch (err: any) {
        rowErrors.push({
          rowIndex: index + 1,
          errors: err.errors ? err.errors.map((item: any) => item.message) : [String(err)],
        });
      }
    }

    if (rowErrors.length > 0) {
      return errorResponse('Validasi impor gagal', 400, { rowErrors });
    }

    await prisma.rekapanInternal.createMany({ data: validRows });
    try {
      const currentUserHeader = request.headers.get('x-current-user');
      let userName = null;
      if (currentUserHeader) {
        try { userName = JSON.parse(currentUserHeader).name; } catch {}
      }
      const createdLog = await prisma.activityLog.create({ data: { type: 'rekapan_internal.import', details: JSON.stringify({ imported: validRows.length }).slice(0, 2000), user: userName, read: false } });
      try { const { publishActivity } = await import('@/lib/activityPubSub'); publishActivity(createdLog); } catch (e) { }
    } catch (e) {
      console.warn('Failed to write activity log', e);
    }
    return jsonResponse({ success: true, message: `${validRows.length} baris berhasil diimpor`, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal mengimpor rekapan internal', 400, String(error));
  }
}
