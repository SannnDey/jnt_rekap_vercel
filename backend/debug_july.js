const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.rekapanOutgoing.findMany({
      where: {},
      select: { id: true, tanggal: true, waybill: true },
      orderBy: { tanggal: 'asc' },
    });
    console.log('total rows', rows.length);
    const july = rows.filter((r) => {
      const d = new Date(r.tanggal);
      return d >= new Date('2026-07-01T00:00:00Z') && d <= new Date('2026-07-31T23:59:59.999Z');
    });
    console.log('july rows count UTC range', july.length);
    console.log(july.map((r) => `${r.id}|${r.waybill}|${new Date(r.tanggal).toISOString()}`).join('\n'));
    const julyLocal = rows.filter((r) => {
      const d = new Date(r.tanggal);
      return d >= new Date('2026-07-01T00:00:00') && d <= new Date('2026-07-31T23:59:59.999');
    });
    console.log('july rows count local range', julyLocal.length);
    console.log(julyLocal.map((r) => `${r.id}|${r.waybill}|${new Date(r.tanggal).toString()}`).join('\n'));
    const excluded = rows.filter((r) => {
      const d = new Date(r.tanggal);
      return !(d >= new Date('2026-07-01T00:00:00') && d <= new Date('2026-07-31T23:59:59.999'));
    });
    console.log('excluded rows count', excluded.length);
    console.log(excluded.map((r) => `${r.id}|${r.waybill}|${new Date(r.tanggal).toISOString()}|${new Date(r.tanggal).toString()}`).join('\n'));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
