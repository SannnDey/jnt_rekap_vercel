import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { SavePayrollHistorySchema } from '@/lib/zod-schemas';

export async function GET(request: NextRequest) {
  try {
    const month = request.nextUrl.searchParams.get('month') ?? undefined;
    const where = month ? { month } : undefined;

    const history = await prisma.payrollHistory.findMany({
      where,
      orderBy: [{ month: 'desc' }, { role: 'asc' }, { employeeName: 'asc' }],
    });

    return jsonResponse({
      success: true,
      message: 'Riwayat payroll berhasil diambil',
      data: history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil riwayat payroll', 500, String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SavePayrollHistorySchema.parse(body);

    await prisma.payrollHistory.deleteMany({
      where: { month: validated.month },
    });

    if (validated.rows.length > 0) {
      await prisma.payrollHistory.createMany({
        data: validated.rows.map((row) => ({
          month: validated.month,
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          role: row.role,
          hadirCount: row.hadirCount,
          basePay: row.basePay,
          makanPay: row.makanPay,
          bonusManual: row.bonusManual,
          awbBonus: row.awbBonus,
          gwBonus: row.gwBonus,
          bonusTotal: row.bonusTotal,
          kasbonAmount: row.kasbonAmount,
          grossPay: row.grossPay,
          netPay: row.netPay,
        })),
        skipDuplicates: true,
      });
    }

    return jsonResponse({
      success: true,
      message: 'Riwayat payroll berhasil disimpan',
      data: { saved: validated.rows.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal menyimpan riwayat payroll', 400, String(error));
  }
}
