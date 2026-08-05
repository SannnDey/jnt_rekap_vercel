import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Scanning rekapan_outgoing for suspect values...');

  // thresholds - tweak as needed
  const ONGKIR_HIGH = 1000000; // > 1M
  const BERAT_UNUSUAL = 100000; // > 100k kg

  const suspects = await prisma.rekapanOutgoing.findMany({
    where: {
      OR: [
        { ongkir: { gt: ONGKIR_HIGH } },
        { beratKg: { gt: BERAT_UNUSUAL } },
      ],
    },
    take: 1000,
  });

  if (suspects.length === 0) {
    console.log('No suspect records found with current thresholds.');
    process.exit(0);
  }

  console.log(`Found ${suspects.length} suspect records:`);
  suspects.forEach((r) => {
    console.log(`${r.id} | waybill=${r.waybill} | ongkir=${r.ongkir} | beratKg=${r.beratKg} | total=${r.total}`);
  });

  // Optionally write to a file
  const fs = await import('fs');
  fs.writeFileSync('suspect_rekapan.json', JSON.stringify(suspects, null, 2), 'utf-8');
  console.log('Wrote suspect_rekapan.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
