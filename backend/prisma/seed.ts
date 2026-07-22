/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const metodePembayaran = ['TRANSFER', 'CASH', 'TF_CASH', 'PICKUP_ONLINE', 'BULANAN'];

const provinces = [
  'Aceh',
  'Sumatra Utara',
  'Sumatra Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatra Selatan',
  'Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
];

const jenisBarang = [
  'Electronics',
  'Pakaian',
  'Makanan & Minuman',
  'Peralatan Rumah Tangga',
  'Buku & Alat Tulis',
  'Furniture',
  'Cosmetics',
  'Spare Parts',
  'Tekstil',
  'Keramik',
];

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Check database connection
    console.log('🔍 Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    const deletedCount = await prisma.rekapanOutgoing.deleteMany();
    if (deletedCount.count > 0) {
      console.log(`✓ Deleted ${deletedCount.count} existing records`);
    } else {
      console.log('✓ No existing records to delete');
    }

    // Generate sample data
    console.log('\n📝 Generating sample data...');
    const sampleData = [];
    const baseDate = new Date(2024, 0, 1); // January 1, 2024

    for (let i = 0; i < 50; i++) {
      const ongkir = Math.floor(Math.random() * 500000) + 10000;
      const asuransi = Math.floor(Math.random() * 100000);
      const packing = Math.floor(Math.random() * 50000);
      const total = ongkir + asuransi + packing;

      const tanggal = new Date(baseDate);
      tanggal.setDate(tanggal.getDate() + i);

      sampleData.push({
        id: uuidv4(),
        tanggalRekap: new Date(),
        tanggal,
        waybill: `WB-${String(i + 1).padStart(6, '0')}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        provinsi: provinces[Math.floor(Math.random() * provinces.length)],
        jenisBarang: jenisBarang[Math.floor(Math.random() * jenisBarang.length)],
        jumlahKoli: Math.floor(Math.random() * 10) + 1,
        beratKg: Math.floor(Math.random() * 50) + 1,
        ongkir,
        asuransi,
        packing,
        total,
        metodePembayaran: metodePembayaran[
          Math.floor(Math.random() * metodePembayaran.length)
        ] as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`✓ Generated ${sampleData.length} sample records\n`);

    // Insert sample data
    console.log('💾 Inserting data into database...');
    const createdData = await prisma.rekapanOutgoing.createMany({
      data: sampleData,
      skipDuplicates: true,
    });

    console.log(`✓ Successfully created ${createdData.count} records\n`);

    // Display summary
    const count = await prisma.rekapanOutgoing.count();
    const summary = await prisma.rekapanOutgoing.aggregate({
      _sum: {
        total: true,
        jumlahKoli: true,
      },
      _avg: {
        beratKg: true,
      },
    });

    console.log('📊 Database Summary:');
    console.log(`   Total Records : ${count}`);
    console.log(`   Total Amount  : Rp ${(summary._sum.total || 0).toLocaleString('id-ID')}`);
    console.log(`   Total Koli    : ${summary._sum.jumlahKoli || 0}`);
    console.log(`   Avg Weight    : ${(summary._avg.beratKg || 0).toFixed(2)} kg\n`);

    console.log('✅ Seeding completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed!\n');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.message.includes('connect')) {
        console.error('\n💡 Tip: Make sure MySQL is running and DATABASE_URL in .env is correct');
        console.error('   DATABASE_URL="mysql://root:root@localhost:3306/jnt_operasional"\n');
      }
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
