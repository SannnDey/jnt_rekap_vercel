# 🚀 Setup Guide - JNT Rekap

Panduan lengkap untuk setup dan menjalankan JNT Rekap sistem.

## 📋 Persyaratan

- **Node.js**: v18 atau lebih tinggi
- **npm** atau **yarn**
- **MySQL**: 5.7 atau lebih tinggi
- **Git** (opsional, untuk version control)

## 🐳 Option 1: Setup dengan Docker (Recommended)

Jika Anda ingin setup MySQL dengan cepat menggunakan Docker:

### 1. Install Docker
- Download dari https://www.docker.com/

### 2. Start MySQL Container
```bash
docker-compose up -d
```

MySQL akan berjalan di `localhost:3306` dengan credentials:
- Username: `jnt_user`
- Password: `jnt_password`
- Database: `jnt_rekap`

PhpMyAdmin untuk GUI akan tersedia di `http://localhost:8080`

## 🛠️ Setup Backend

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Jika menggunakan Docker
DATABASE_URL="mysql://jnt_user:jnt_password@localhost:3306/jnt_rekap"

# Atau jika MySQL sudah installed locally
DATABASE_URL="mysql://root:password@localhost:3306/jnt_rekap"

PORT=3000
NODE_ENV=development
```

### 4. Setup Database & Seed Data
```bash
# One-liner setup
npm run db:setup

# Or step by step:
npm run prisma:generate    # Generate Prisma Client
npm run prisma:push        # Push schema ke database
npm run prisma:seed        # Seed 50 data dummy
```

### 5. Run Development Server
```bash
npm run dev
```

Output akan menampilkan: `🚀 Server running on http://localhost:3000`

### 6. Verify Backend
Buka browser dan akses: `http://localhost:3000/health`

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## 🎨 Setup Frontend

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
```

File `.env.local` sudah benar (mengarah ke backend di localhost:3000):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Run Development Server
```bash
npm run dev
```

Output akan menampilkan: `▲ Next.js x.x.x` dan localhost URL (biasanya `http://localhost:3001`)

### 5. Open in Browser
Buka `http://localhost:3001` dan Anda akan melihat aplikasi JNT Rekap!

## ✅ Verify Setup

### Checklist:
- ✓ Backend running di `http://localhost:3000`
- ✓ Frontend running di `http://localhost:3001`
- ✓ MySQL connected (check di backend console)
- ✓ 50 sample data seeded ke database

### Test Create Data:
1. Buka frontend di `http://localhost:3001`
2. Klik "+ Tambah Rekapan"
3. Isi form:
   - Tanggal: Pilih hari apapun
   - Waybill: `TEST-001`
   - Provinsi: `DKI Jakarta`
   - Jenis Barang: `Electronics`
   - Jumlah Koli: `5`
   - Berat: `10`
   - Ongkir: `50000`
   - Asuransi: `10000`
   - Packing: `5000`
   - Metode: `TRANSFER`
4. Klik "Tambah Rekapan"
5. Jika berhasil, data akan muncul di tabel

## 📱 API Testing dengan Postman

1. Import file: `JNT-Rekap-API.postman_collection.json`
2. Set variable `rekapan_id` dengan ID dari database
3. Test endpoints

## 🔍 View Database Data

Gunakan Prisma Studio:

**Backend folder:**
```bash
npm run prisma:studio
```

Akan buka GUI di `http://localhost:5555`

## 🐛 Troubleshooting

### Backend tidak bisa connect ke MySQL

**Problem**: `ECONNREFUSED 127.0.0.1:3306`

**Solution**:
- Pastikan MySQL running
- Cek DATABASE_URL di `.env`
- Jika menggunakan Docker: `docker-compose ps` (pastikan mysql container UP)

### Frontend API Error

**Problem**: `Failed to fetch from http://localhost:3000/api`

**Solution**:
- Pastikan backend running: `http://localhost:3000/health`
- Cek NEXT_PUBLIC_API_URL di `frontend/.env.local`
- Check browser console untuk error detail

### Data tidak muncul di frontend

**Problem**: Tabel kosong

**Solution**:
```bash
# Re-seed database
cd backend
npm run prisma:seed
```

### Port sudah digunakan

**Problem**: `Port 3000 already in use`

**Solution**:
```bash
# Gunakan port berbeda
PORT=3001 npm run dev

# Atau kill process yang menggunakan port:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

## 📚 Useful Commands

### Backend
```bash
npm run dev              # Start development
npm run build            # Build for production
npm run start            # Run production build
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:seed      # Run seeder
npm run prisma:reset     # Reset database (DANGER!)
npm run prisma:migrate   # Create new migration
```

### Frontend
```bash
npm run dev              # Start development
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Run ESLint
```

## 🎯 Next Steps Setelah Setup

1. **Customize untuk kebutuhan Anda**:
   - Tambah kolom di Prisma schema
   - Update API endpoints
   - Customize UI components

2. **Production Deployment**:
   - Setup database production (Cloud SQL, RDS, etc)
   - Deploy backend (Railway, Render, Heroku)
   - Deploy frontend (Vercel, Netlify)

3. **Tambah Fitur**:
   - Export ke Excel
   - Print PDF
   - Authentication/Authorization
   - Advanced filtering & reporting

## 📞 Support

Jika ada pertanyaan atau error:
1. Check `README.md` di root folder
2. Lihat error message di backend console
3. Check browser console (F12) di frontend
4. Run `npm run prisma:studio` untuk debug database

---

**Happy Coding! 🎉**
