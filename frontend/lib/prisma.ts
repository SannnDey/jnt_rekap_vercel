import { PrismaClient } from '@prisma/client';

const globalWithPrisma = global as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalWithPrisma.prisma ?? new PrismaClient({ log: ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prisma = prisma;
}
