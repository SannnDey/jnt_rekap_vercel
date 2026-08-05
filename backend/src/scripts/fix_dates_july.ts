import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const updates = [
    { id: 'a32d677b-ec8c-4277-9429-0ce49438180e', newDate: new Date('2026-07-29T00:00:00.000Z') },
    { id: 'b7bda321-3bba-42dc-800d-deeeb9ed1b13', newDate: new Date('2026-07-28T00:00:00.000Z') },
  ];

  console.log('Preview - current values for targets:');
  const current = await prisma.rekapanOutgoing.findMany({ where: { id: { in: updates.map(u => u.id) } } });
  current.forEach(r => console.log({ id: r.id, waybill: r.waybill, tanggal: r.tanggal }));

  for (const u of updates) {
    console.log(`Updating ${u.id} -> ${u.newDate.toISOString()}`);
    await prisma.rekapanOutgoing.update({ where: { id: u.id }, data: { tanggal: u.newDate } });
  }

  console.log('After update - values:');
  const after = await prisma.rekapanOutgoing.findMany({ where: { id: { in: updates.map(u => u.id) } } });
  after.forEach(r => console.log({ id: r.id, waybill: r.waybill, tanggal: r.tanggal }));

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
