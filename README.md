# JNT Rekap - Sistem Rekapan Outgoing Barang

Sistem berbasis web untuk mengelola rekapan pengiriman barang JNT Express. Dibangun dengan teknologi modern dan menggunakan UUID sebagai primary key.

## 🎯 Fitur Utama

- ✅ CRUD Rekapan Outgoing Barang
- ✅ Search & Filter (berdasarkan waybill, provinsi, jenis barang, tanggal)
- ✅ Pagination
- ✅ Summary statistik
- ✅ UUID sebagai primary key
- ✅ Validasi data dengan Zod
- ✅ UI responsif dengan Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MySQL
- **Validation**: Zod

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React dengan Tailwind CSS
- **Data Fetching**: Axios + React Query
- **Styling**: Tailwind CSS

## 📋 Database Schema

```
RekapanOutgoing
├── id (UUID, PK)
├── tanggalRekap (DateTime)
├── tanggal (DateTime) - indexed
├── waybill (String) - indexed
├── provinsi (String)
├── jenisBarang (String)
├── jumlahKoli (Int)
├── beratKg (Float)
├── ongkir (Int)
├── asuransi (Int)
├── packing (Int)
├── total (Int = ongkir + asuransi + packing)
├── metodePembayaran (Enum) - indexed
├── createdAt (DateTime)
├── updatedAt (DateTime)
```

## 🚀 Setup Awal

### Prerequisites
- Node.js v18+
- MySQL 5.7+
- npm atau yarn

### Backend Setup

1. **Masuk ke folder backend**
   ```bash
   cd backend
   npm install
   ```

2. **Konfigurasi environment**
   ```bash
   cp .env.example .env
   # Edit .env dengan database credentials Anda
   ```

3. **Setup database**
   ```bash
   npm run db:setup
   # Atau step by step:
   npm run prisma:generate  # Generate Prisma Client
   npm run prisma:push      # Push schema ke database
   npm run prisma:seed      # Seed data default
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Backend akan berjalan di `http://localhost:3000`

### Frontend Setup

1. **Masuk ke folder frontend**
   ```bash
   cd frontend
   npm install
   ```

2. **Konfigurasi environment**
   ```bash
   cp .env.example .env.local
   # Ubah NEXT_PUBLIC_API_URL jika backend di tempat lain
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Frontend akan berjalan di `http://localhost:3001`

## 📡 API Endpoints

### Rekapan Outgoing

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/rekapan` | Buat rekapan baru |
| GET | `/api/rekapan` | Dapatkan semua rekapan (dengan pagination & filter) |
| GET | `/api/rekapan/{id}` | Dapatkan rekapan berdasarkan ID |
| PUT | `/api/rekapan/{id}` | Update rekapan |
| DELETE | `/api/rekapan/{id}` | Hapus rekapan |
| GET | `/api/rekapan/summary` | Dapatkan statistik summary |

### Query Parameters

**GET /api/rekapan**
- `page`: Halaman (default: 1)
- `limit`: Item per halaman (default: 10, max: 100)
- `search`: Cari di waybill/provinsi/jenisBarang
- `startDate`: Filter tanggal mulai (format: YYYY-MM-DD)
- `endDate`: Filter tanggal akhir (format: YYYY-MM-DD)

## 📝 Contoh Request

### Create Rekapan
```bash
curl -X POST http://localhost:3000/api/rekapan \
  -H "Content-Type: application/json" \
  -d '{
    "tanggal": "2024-01-15",
    "waybill": "WB-000001-ABCDE",
    "provinsi": "DKI Jakarta",
    "jenisBarang": "Electronics",
    "jumlahKoli": 5,
    "beratKg": 12.5,
    "ongkir": 50000,
    "asuransi": 10000,
    "packing": 5000,
    "metodePembayaran": "TRANSFER"
  }'
```

### Update Rekapan
```bash
curl -X PUT http://localhost:3000/api/rekapan/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "ongkir": 55000,
    "asuransi": 12000
  }'
```

### Get Summary
```bash
curl http://localhost:3000/api/rekapan/summary \
  ?startDate=2024-01-01&endDate=2024-01-31
```

## 🔍 Data Seeder

Database dilengkapi dengan 50 data dummy untuk testing. Jalankan untuk regenerate:

```bash
npm run prisma:seed
```

## 📁 Struktur Project

```
jnt_rekap/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── controllers/          # Business logic
│   │   ├── routes/               # API routes
│   │   ├── schemas/              # Zod validation schemas
│   │   └── middleware/           # Custom middleware
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # Seeder
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   ├── config.ts             # Configuration
│   │   └── utils.ts              # Utility functions
│   ├── types/                    # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

## 🔐 Security Best Practices

- UUID digenerate di backend (bukan frontend)
- Validasi input dengan Zod
- Error handling yang proper
- CORS configured di backend

## 📦 Deployment

### Backend (Vercel/Railway/Render)
```bash
# Build
npm run build

# Start
npm start
```

### Frontend (Vercel)
```bash
# Auto-deploy dari repository
vercel
```

## 🐛 Troubleshooting

### MySQL Connection Error
- Pastikan MySQL running
- Cek DATABASE_URL di .env
- Pastikan credentials benar

### API Not Found
- Pastikan backend running di port 3000
- Cek NEXT_PUBLIC_API_URL di frontend

### Data tidak muncul
- Jalankan `npm run prisma:seed`
- Cek database dengan `npm run prisma:studio`

## 📞 Support

Untuk pertanyaan atau issue, silakan buat issue di repository.

## 📄 License

MIT

---

**Last Updated**: 22 July 2024
