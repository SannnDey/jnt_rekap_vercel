# ⚡ Quick Start Guide - JNT Rekap

**Panduan tercepat untuk mulai menggunakan JNT Rekap!**

## 🎯 Dapat Diselesaikan dalam 5 Menit

## 📋 Yang Anda Miliki

```
✅ Database: jnt_operasional
✅ User: root
✅ Password: root
✅ Host: localhost
```

## 🚀 Step 1: Run Setup Script

**Pilih salah satu sesuai OS Anda:**

### Windows (PowerShell)
```powershell
# Buka PowerShell as Administrator, lalu:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Jalankan script
.\run-backend.ps1
```

### Windows (CMD/BAT)
```bash
run-backend.bat
```

### Mac/Linux
```bash
chmod +x run-backend.sh
./run-backend.sh
```

## 🎯 Step 2: Backend Berhasil Jika Ada Output Seperti Ini:

```
════════════════════════════════════════════════════════
🚀 Server Running
════════════════════════════════════════════════════════
🌐 URL       : http://localhost:3000
📝 API Docs  : http://localhost:3000/api
💚 Health    : http://localhost:3000/health
📚 Database  : operasional@localhost:3306
🔧 Environment: development
════════════════════════════════════════════════════════
```

## ✅ Step 3: Test API di Browser

Buka di browser Anda:

```
http://localhost:3000/health
```

Harus tampil:
```json
{
  "status": "OK",
  "timestamp": "2024-07-22T10:30:45.123Z",
  "uptime": 1234.567
}
```

## 🎨 Step 4: Setup Frontend (Terminal Baru)

```bash
cd frontend
npm install
npm run dev
```

**Frontend akan jalan di**: `http://localhost:3001`

## 📊 Step 5: Lihat Data

### Di Browser
```
http://localhost:3001
```

### Di Prisma Studio (Database GUI)
```bash
cd backend
npm run prisma:studio
```

Buka: `http://localhost:5555`

## 🧪 Step 6: Test API dengan Postman (Optional)

1. Download Postman: https://www.postman.com/downloads/
2. Buka file: `JNT-Rekap-API.postman_collection.json`
3. Test endpoints

## 🐛 Masalah? Cek Ini:

### ❌ "Cannot connect to database"
```bash
# Pastikan MySQL running
# Di Command Prompt:
mysql -u root -p -e "SELECT 1"
# Masukkan password: root
```

### ❌ "Port 3000 already in use"
Edit `backend/.env`:
```
PORT=3001
```

### ❌ "npm: command not found"
Install Node.js dari: https://nodejs.org/ (v18+)

### ❌ "Database jnt_operasional not found"
Buat database:
```bash
mysql -u root -p -e "CREATE DATABASE jnt_operasional;"
```

## 📚 Dokumentasi Lengkap

- **Setup Database**: [SETUP_DATABASE.md](SETUP_DATABASE.md)
- **API Reference**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Development**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **ReadMe**: [README.md](README.md)

## 🎯 Struktur Project

```
jnt_rekap/
├── backend/          ← API Server (port 3000)
├── frontend/         ← Web UI (port 3001)
├── docs/             ← Documentation
└── setup scripts     ← Automation
```

## 📱 Endpoint Penting

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/rekapan` | GET | Ambil semua data |
| `/api/rekapan` | POST | Buat data baru |
| `/api/rekapan/{id}` | GET | Ambil 1 data |
| `/api/rekapan/{id}` | PUT | Update data |
| `/api/rekapan/{id}` | DELETE | Hapus data |
| `/api/rekapan/summary` | GET | Statistik |

## 🎓 Perintah Penting

```bash
# Backend
cd backend
npm run dev              # Start dev server
npm run build            # Build for production
npm run db:setup         # Setup database
npm run prisma:studio    # View database GUI
npm run prisma:seed      # Seed data

# Frontend
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production

# Database
npm run db:reset         # ⚠️ Delete semua data!
```

## 💡 Tips

1. **Keep Both Running**: Buka 2 terminal, satu untuk backend, satu untuk frontend
2. **Hot Reload**: Code automatically reload saat Anda buat perubahan
3. **Database GUI**: Gunakan `npm run prisma:studio` untuk manage data
4. **API Testing**: Test dengan Postman Collection yang sudah disediakan

## 🎉 Selesai!

Sistem sudah siap digunakan!

**Backend**: http://localhost:3000  
**Frontend**: http://localhost:3001

---

**Butuh bantuan?** Cek [SETUP_DATABASE.md](SETUP_DATABASE.md) untuk troubleshooting lebih detail.

**Last Updated**: July 22, 2024
