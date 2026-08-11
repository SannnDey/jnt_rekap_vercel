import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { PayrollRateSchema } from '@/lib/zod-schemas';

export async function PUT(request: NextRequest, { params }: { params: { month: string } }) {
  try {
    const { month } = params;
    if (!month) {
      return errorResponse('Bulan tidak diberikan', 400);
    }

    const body = await request.json();
    const validated = PayrollRateSchema.parse(body);

    const payrollRate = await prisma.payrollRate.upsert({
      where: { month },
      create: {
        month,
        adminBase: validated.adminBase,
        driverBase: validated.driverBase,
        makan: validated.makan,
        awb: validated.awb,
        gw: validated.gw,
      },
      update: {
        adminBase: validated.adminBase,
        driverBase: validated.driverBase,
        makan: validated.makan,
        awb: validated.awb,
        gw: validated.gw,
      },
    });

    return jsonResponse({
      success: true,
      message: 'Tarif payroll berhasil disimpan',
      data: payrollRate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal menyimpan tarif payroll', 400, String(error));
  }
}
