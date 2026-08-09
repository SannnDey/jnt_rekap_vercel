import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { CreateRekapanOutgoingSchema, UpdateRekapanOutgoingSchema, RekapanOutgoingIdSchema } from '@/lib/zod-schemas';

const roundToThree = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;
const calculateTotal = (ongkir: number, asuransi: number, packing: number) => ongkir + asuransi + packing;

const parseLocalDate = (value: string, endOfDay = false): Date => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) throw new Error(`Invalid date format: ${value}`);
  const date = new Date(year, month - 1, day);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
};

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const search = url.searchParams.get('search');
    const provinsi = url.searchParams.get('provinsi');
    const metodePembayaran = url.searchParams.get('metodePembayaran');
    const sortBy = url.searchParams.get('sortBy') ?? 'tanggal';
    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc';
    const all = String(url.searchParams.get('all') ?? '').toLowerCase() === 'true';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(10000, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { waybill: { contains: search } },
        { provinsi: { contains: search } },
        { jenisBarang: { contains: search } },
      ];
    }

    if (provinsi) where.provinsi = { equals: provinsi };
    if (metodePembayaran) where.metodePembayaran = metodePembayaran;

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
          ? parseLocalDate(startDate)
          : new Date(startDate);
      }
      if (endDate) {
        where.tanggal.lte = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
          ? parseLocalDate(endDate, true)
          : new Date(endDate);
      }
    }

    const orderByField = ['tanggal', 'ongkir', 'beratKg', 'total', 'jumlahKoli'].includes(sortBy)
      ? sortBy
      : 'tanggal';
    const orderBy = { [orderByField]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' };

    let data: any[] = [];
    let total = 0;

    if (all) {
      data = await prisma.rekapanOutgoing.findMany({ where, orderBy });
      total = data.length;
    } else {
      [data, total] = await Promise.all([
        prisma.rekapanOutgoing.findMany({ where, skip, take: limitNum, orderBy }),
        prisma.rekapanOutgoing.count({ where }),
      ]);
    }

    return jsonResponse({
      success: true,
      message: 'Data rekapan berhasil diambil',
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse('Gagal mengambil data rekapan', 500, String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateRekapanOutgoingSchema.parse(body);

    const sanitized = {
      ...validated,
      jumlahKoli: Math.round(validated.jumlahKoli),
      beratKg: roundToThree(validated.beratKg),
      ongkir: Math.round(validated.ongkir),
      asuransi: Math.round(validated.asuransi),
      packing: Math.round(validated.packing),
    };
    const total = calculateTotal(sanitized.ongkir, sanitized.asuransi, sanitized.packing);

    const rekapan = await prisma.rekapanOutgoing.create({ data: { ...sanitized, total } });
    return jsonResponse({ success: true, message: 'Rekapan berhasil dibuat', data: rekapan, timestamp: new Date().toISOString() }, 201);
  } catch (error) {
    return errorResponse('Gagal membuat rekapan', 400, String(error));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('ID rekapan diperlukan', 400);

    const body = await request.json();
    const validatedId = RekapanOutgoingIdSchema.parse({ id });
    const validatedData = UpdateRekapanOutgoingSchema.parse(body);

    const existing = await prisma.rekapanOutgoing.findUnique({ where: { id: validatedId.id } });
    if (!existing) return errorResponse('Rekapan tidak ditemukan', 404);

    const dataToUpdate: any = { ...validatedData };
    if (dataToUpdate.jumlahKoli !== undefined) dataToUpdate.jumlahKoli = Math.round(dataToUpdate.jumlahKoli);
    if (dataToUpdate.beratKg !== undefined) dataToUpdate.beratKg = roundToThree(dataToUpdate.beratKg);
    if (dataToUpdate.ongkir !== undefined) dataToUpdate.ongkir = Math.round(dataToUpdate.ongkir);
    if (dataToUpdate.asuransi !== undefined) dataToUpdate.asuransi = Math.round(dataToUpdate.asuransi);
    if (dataToUpdate.packing !== undefined) dataToUpdate.packing = Math.round(dataToUpdate.packing);

    if (validatedData.ongkir !== undefined || validatedData.asuransi !== undefined || validatedData.packing !== undefined) {
      const ongkir = validatedData.ongkir ?? existing.ongkir;
      const asuransi = validatedData.asuransi ?? existing.asuransi;
      const packing = validatedData.packing ?? existing.packing;
      dataToUpdate.total = calculateTotal(ongkir, asuransi, packing);
    }

    const rekapan = await prisma.rekapanOutgoing.update({ where: { id: validatedId.id }, data: dataToUpdate });
    return jsonResponse({ success: true, message: 'Rekapan berhasil diperbarui', data: rekapan, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal memperbarui rekapan', 400, String(error));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('ID rekapan diperlukan', 400);

    const validatedId = RekapanOutgoingIdSchema.parse({ id });
    const rekapan = await prisma.rekapanOutgoing.findUnique({ where: { id: validatedId.id } });
    if (!rekapan) return errorResponse('Rekapan tidak ditemukan', 404);

    await prisma.rekapanOutgoing.delete({ where: { id: validatedId.id } });
    return jsonResponse({ success: true, message: 'Rekapan berhasil dihapus', data: rekapan, timestamp: new Date().toISOString() });
  } catch (error) {
    return errorResponse('Gagal menghapus rekapan', 400, String(error));
  }
}
