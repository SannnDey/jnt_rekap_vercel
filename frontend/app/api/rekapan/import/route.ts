import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { CreateRekapanOutgoingSchema } from '@/lib/zod-schemas';

const roundToThree = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;
const calculateTotal = (ongkir: number, asuransi: number, packing: number) => ongkir + asuransi + packing;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const rowErrors: Array<{ rowIndex: number; errors: string[] }> = [];
    const validRows: any[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      try {
        const parsed = CreateRekapanOutgoingSchema.parse(rows[index]);
        const sanitized = {
          ...parsed,
          jumlahKoli: Math.round(parsed.jumlahKoli),
          beratKg: roundToThree(parsed.beratKg),
          ongkir: Math.round(parsed.ongkir),
          asuransi: Math.round(parsed.asuransi),
          packing: Math.round(parsed.packing),
        };
        validRows.push({ ...sanitized, total: calculateTotal(sanitized.ongkir, sanitized.asuransi, sanitized.packing) });
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

    await prisma.rekapanOutgoing.createMany({ data: validRows });
    return jsonResponse({ success: true, message: `${validRows.length} baris berhasil diimpor`, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal mengimpor rekapan', 400, String(error));
  }
}
