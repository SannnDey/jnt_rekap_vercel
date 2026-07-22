# 🚀 JNT Rekap - Setup Database & Backend

Panduan lengkap untuk setup backend dan database Anda.

## 📋 Prerequisites

- Node.js v18+
- MySQL Server 5.7+
- Git (optional)

## 🗄️ Database yang Sudah Dibuat

Anda sudah memiliki:
- **Database Name**: `jnt_operasional`
- **User**: `root`
- **Password**: `root`
- **Host**: `localhost` (default)

## 🔧 Setup Backend

### 1. Navigate ke Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

File `.env` sudah dibuat dengan credentials yang benar:

```bash
DATABASE_URL="mysql://root:root@localhost:3306/jnt_operasional"
PORT=3000
NODE_ENV=development
```

**Jika perlu edit**, buka file `backend/.env` dan sesuaikan jika ada yang berbeda.

### 4. Jalankan Database Setup

#### Option A: Automated (Recommended)

```bash
npm run db:setup
```

Ini akan melakukan:
1. Generate Prisma Client
2. Push schema ke database
3. Seed data (50 records dummy)

#### Option B: Manual Step-by-Step

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Push schema ke database
npm run prisma:push

# 3. Seed data
npm run prisma:seed
```

### 5. Troubleshooting Database Connection

Jika ada error saat setup database:

**Error: "connect ECONNREFUSED"**
- ✅ Pastikan MySQL Server sudah berjalan
- ✅ Pastikan DATABASE_URL benar di file `.env`
- ✅ Pastikan port MySQL default (3306) tidak diubah

**Error: "Access denied for user 'root'@'localhost'"**
- ✅ Pastikan username & password sudah benar
- ✅ Cek kembali credentials di `.env`

**Error: "Unknown database 'jnt_operasional'"**
- ✅ Database sudah dibuat? Cek di MySQL
- ✅ Jalankan: `mysql -u root -p -e "CREATE DATABASE jnt_operasional;"`

### 6. Verify Database

Untuk melihat data di database secara visual:

```bash
npm run prisma:studio
```

Ini akan buka Prisma Studio di browser (http://localhost:5555)

## 🚀 Run Backend

Setelah setup selesai, jalankan backend:

```bash
npm run dev
```

Expected output:
```
════════════════════════════════════════════════════════════
🚀 Server Running
════════════════════════════════════════════════════════════
🌐 URL       : http://localhost:3000
📝 API Docs  : http://localhost:3000/api
💚 Health    : http://localhost:3000/health
📚 Database  : operasional@localhost:3306
🔧 Environment: development
════════════════════════════════════════════════════════════
```

## 🧪 Test API

### Health Check
```bash
curl http://localhost:3000/health
```

### Get All Data
```bash
curl http://localhost:3000/api/rekapan?page=1&limit=10
```

### Get Summary
```bash
curl http://localhost:3000/api/rekapan/summary
```

## 📊 Database Commands

```bash
# View database visually
npm run prisma:studio

# Check migration status
npm run prisma:migrate -- --status

# View current schema
npm run prisma:pull

# Reset database (delete all data!)
npm run db:reset

# Seed ulang data
npm run prisma:seed
```

## ❌ Reset Database (If Needed)

Jika perlu start fresh:

```bash
npm run db:reset
```

⚠️ **Warning**: Ini akan **menghapus semua data** di database!

## 📝 Environment Configuration

Edit `backend/.env` untuk customization:

```bash
# Database
DATABASE_URL="mysql://root:root@localhost:3306/jnt_operasional"

# Server
PORT=3000

# Environment
NODE_ENV=development
# NODE_ENV=production (untuk production)

# Frontend URL (for CORS)
# FRONTEND_URL=http://localhost:3001
```

## 💡 File Structure

```
backend/
├── src/
│   ├── index.ts                    # Entry point
│   ├── controllers/
│   │   └── rekapan.controller.ts   # Business logic
│   ├── routes/
│   │   └── rekapan.routes.ts       # API routes
│   ├── schemas/
│   │   └── rekapan.schema.ts       # Zod validation
│   └── middleware/
│       └── errorHandler.ts         # Error handling
├── prisma/
│   ├── schema.prisma               # Database schema ✨ NEW
│   └── seed.ts                     # Data seeder ✨ IMPROVED
├── .env                            # Environment variables ✨ NEW
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

## 🎯 Next Steps

1. ✅ Backend running di http://localhost:3000
2. 🔄 Setup frontend di folder `frontend/`
3. 🧪 Test API dengan Postman (import `JNT-Rekap-API.postman_collection.json`)
4. 🌐 Connect frontend ke backend API

## 🔗 Useful Links

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## 📞 Troubleshooting

### Common Issues & Solutions

**Q: "Cannot find module 'express'"**
- A: `npm install`

**Q: "Prisma Client not generated"**
- A: `npm run prisma:generate`

**Q: "Database not found"**
- A: Cek MySQL, database harus ada. Jalankan: `npx prisma db push --force-reset`

**Q: Bagaimana cara reset semua?**
- A: `npm run db:reset` (warning: hapus semua data!)

---

**Created**: July 22, 2024
**Last Updated**: July 22, 2024
