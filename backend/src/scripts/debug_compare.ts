import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const startDate = process.env.START_DATE || '2026-07-01';
  const endDate = process.env.END_DATE || '2026-07-31';
  console.log('Comparing for', startDate, endDate);

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    end.setHours(23, 59, 59, 999);
  }

  const whereDate = { tanggal: { gte: start, lte: end } } as any;

  const all = await prisma.rekapanOutgoing.findMany({ where: {} , orderBy: { tanggal: 'desc' } });
  const filtered = await prisma.rekapanOutgoing.findMany({ where: whereDate, orderBy: { tanggal: 'desc' } });

  console.log('All total:', all.length);
  console.log('Filtered total:', filtered.length);

  const allIds = all.map((r) => r.id);
  const filteredIds = filtered.map((r) => r.id);

  const missingInFiltered = allIds.filter((id) => !filteredIds.includes(id));
  const missingInAll = filteredIds.filter((id) => !allIds.includes(id));

  console.log('Missing in filtered (present in all but not in filtered):', missingInFiltered.length);
  if (missingInFiltered.length > 0) {
    const rows = await prisma.rekapanOutgoing.findMany({ where: { id: { in: missingInFiltered } } });
    console.log(rows.map(r => ({ id: r.id, waybill: r.waybill, tanggal: r.tanggal } )));
  }

  console.log('Samples in filtered not in all (unexpected):', missingInAll.length);

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
