import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'driver' } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await prisma.userAccount.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }

    const user = await prisma.userAccount.create({
      data: {
        name,
        email: normalizedEmail,
        password,
        role: role === 'admin' ? 'ADMIN' : role === 'developer' ? 'DEVELOPER' : 'DRIVER',
        status: 'PENDING',
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal mendaftar pengguna.' }, { status: 500 });
  }
}
