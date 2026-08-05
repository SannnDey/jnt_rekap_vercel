'use client';

import Link from 'next/link';
import Header from '@/components/Header';

const modules = [
   {
    title: 'Rekapan Internal Harian',
    description: 'Kelola data internal harian dengan form dan tabel ringkas.',
    href: '/rekapan-internal-harian',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Rekapan Outgoing',
    description: 'Kelola data pengiriman keluar dan lihat ringkasan operasional.',
    href: '/rekapan-outgoing',
    accent: 'from-sky-500 to-cyan-500',
  },
  {
    title: 'Rekapan Pengeluaran Harian',
    description: 'Catat pengeluaran harian dan lihat ringkasannya.',
    href: '/rekapan-pengeluaran-harian-outgoing',
    accent: 'from-emerald-500 to-lime-500',
  },
  {
    title: 'Rekapan Kasbon',
    description: 'Pantau kasbon per karyawan dan riwayat transaksi.',
    href: '/rekapan-kasbon',
    accent: 'from-violet-500 to-fuchsia-500',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Header
        title="Dashboard Utama"
        subtitle="Sistem Rekap J&T Cargo BDG015A"
        description="Pusat kontrol untuk mengelola semua rekap J&T Cargo."
        right={
          <div className="space-y-2 text-sm leading-6 text-slate-200">
            <p className="font-semibold uppercase tracking-[0.3em] text-sky-300">Navigasi Cepat</p>
            <p>Semua modul penting berada dalam satu halaman yang rapi.</p>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-sky-200 shadow-sm shadow-sky-500/10">
                Selamat Datang
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Kelola semua rekap dengan akurat dan tepat.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-slate-300">
                  Akses cepat ke pengeluaran, kasbon, outgoing, dan internal harian.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Modul Tersedia</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{modules.length}</p>
                  <p className="mt-2 text-sm text-slate-400">Satu klik untuk masuk ke setiap area kerja penting.</p>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Keunggulan</p>
                  <p className="mt-3 text-3xl font-semibold text-white">Antarmuka Premium</p>
                  <p className="mt-2 text-sm text-slate-400">Desain modern, kontras tajam, dan navigasi yang lebih nyaman.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Sorotan Modul</p>
              <div className="mt-6 space-y-4">
                {modules.map((module) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group flex items-start gap-4 rounded-[1.75rem] border border-white/5 bg-white/5 px-5 py-5 transition hover:border-sky-300/40 hover:bg-slate-900/90"
                  >
                    <div className={`mt-1 h-12 w-12 rounded-3xl bg-gradient-to-br ${module.accent} p-3 shadow-lg shadow-slate-950/20`} />
                    <div className="grow">
                      <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
                    </div>
                    <span className="self-center text-sky-300 transition group-hover:translate-x-1">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Performa</p>
            <p className="mt-4 text-3xl font-semibold text-white">Lebih cepat</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">Antarmuka responsif dengan hierarki visual yang jelas.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Keamanan</p>
            <p className="mt-4 text-3xl font-semibold text-white">Tingkat tinggi</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">Desain menekankan kontras dan kejelasan data dalam lingkungan kerja yang aman.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Produktivitas</p>
            <p className="mt-4 text-3xl font-semibold text-white">Lebih fokus</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">Navigasi modul yang mudah membuat pekerjaan menjadi lebih terorganisir.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
