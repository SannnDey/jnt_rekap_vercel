import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.userAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengambil data user.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, status, role } = body;

    if (!userId || !status) {
      return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
    }

    const normalizedStatus = status === 'approved' ? 'APPROVED' : status === 'rejected' ? 'REJECTED' : 'PENDING';

    const data: any = { status: normalizedStatus };
    if (role) {
      const normalizedRole = role === 'admin' ? 'ADMIN' : role === 'developer' ? 'DEVELOPER' : 'DRIVER';
      data.role = normalizedRole;
    }

    const updated = await prisma.userAccount.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mengubah status user.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID wajib diisi.' }, { status: 400 });
    }

    await prisma.userAccount.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal menghapus user.' }, { status: 500 });
  }
}
