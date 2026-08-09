# Vercel Deployment Guide

## Siapkan aplikasi di Vercel

1. Buka dashboard Vercel dan buat project baru dari repository GitHub kamu.
2. Pada konfigurasi project, pilih `frontend` sebagai root directory.
   - Ini penting karena repo kamu ada dua folder: `backend` dan `frontend`.

## Build settings

- Build Command: `npm run build`
- Output Directory: default (`.next`)
- Root Directory: `frontend`

> `vercel.json` di folder `frontend` sudah ada dan sudah cocok untuk Next.js App Router.

## Environment Variables yang harus di-set

Tambahkan environment variables di Vercel untuk `Production` dan `Preview` (jika dipakai):

- `DATABASE_URL`
  - Contoh: `mysql://username:password@host:3306/jnt_recap`
  - Pastikan database ini dapat diakses oleh Vercel.
  - Jangan gunakan `localhost` jika deploy ke Vercel.

- `NEXT_PUBLIC_API_URL`
  - Nilai: `/api`
  - Karena frontend dan API route berada di dalam aplikasi Next.js yang sama.

## Kenapa ini penting

- Kode kamu sudah bisa build di `frontend`.
- Tapi ketika dijalankan di Vercel, aplikasi membutuhkan `DATABASE_URL` untuk Prisma.
- Jika `DATABASE_URL` tidak tersedia atau mengarah ke database lokal, API akan gagal.

## Pastikan database production bisa diakses

1. Gunakan MySQL yang tersedia di internet, misalnya:
   - managed database di Railway, Render, PlanetScale, Google Cloud SQL, AWS RDS, atau layanan lain.
2. Pastikan host/port/user/password sudah benar.
3. Pastikan firewall/IP akses mengizinkan koneksi dari Vercel.

## Setelah deploy

- Cek log deploy di Vercel.
- Pastikan build sukses dan route API tersedia.
- Jika ada error `Prisma` atau `DATABASE_URL`, periksa kembali env vars di Vercel.

## Tips cepat

- Jika kamu belum punya database production, gunakan layanan managed database.
- Jika mau test deploy tanpa production DB, gunakan database staging yang bisa diakses dari Vercel.
- `NEXT_PUBLIC_API_URL` harus tetap `/api`.

## Ringkas

- Kode: sudah siap
- Build: sudah berhasil
- Perbaikan utama: env vars `DATABASE_URL` + akses database production dari Vercel
