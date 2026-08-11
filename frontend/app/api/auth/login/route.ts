import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    if (!prisma || !(prisma as any).userAccount) {
      console.error('Prisma client missing or model not generated', Object.keys(prisma || {}));
      return NextResponse.json({ message: 'Server misconfiguration: database client not ready.' }, { status: 500 });
    }

    const user = await prisma.userAccount.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 });
    }

    if (user.status !== 'APPROVED') {
      return NextResponse.json({ message: 'Akun Anda masih menunggu persetujuan admin.' }, { status: 403 });
    }

    await prisma.userAccount.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal login.' }, { status: 500 });
  }
}
