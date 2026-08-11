import { PrismaClient } from '@prisma/client';

// Prisma client typing may be stale if `prisma generate` failed earlier
// (Windows EPERM rename). Cast to `any` here to allow seeding to run
// while the generated client is repaired.
const prisma: any = new PrismaClient();

async function main() {
  const existing = await prisma.userAccount.findUnique({
    where: { email: 'admin@jntrekap.com' },
  });

  if (!existing) {
    await prisma.userAccount.create({
      data: {
        name: 'Admin Utama',
        email: 'admin@jntrekap.com',
        password: 'admin123',
        role: 'DEVELOPER',
        status: 'APPROVED',
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
