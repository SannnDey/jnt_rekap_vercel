import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const startDate = '2026-07-01';
  const endDate = '2026-07-31';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    end.setHours(23, 59, 59, 999);
  }

  console.log('start', start.toISOString());
  console.log('end', end.toISOString());

  const count = await prisma.rekapanOutgoing.count({
    where: {
      tanggal: {
        gte: start,
        lte: end,
      },
    },
  });

  const rows = await prisma.rekapanOutgoing.findMany({
    where: {
      tanggal: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { tanggal: 'desc' },
    take: 100,
  });

  console.log('count', count);
  rows.forEach((r) => {
    console.log({ id: r.id, waybill: r.waybill, tanggal: r.tanggal.toISOString() });
  });
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});