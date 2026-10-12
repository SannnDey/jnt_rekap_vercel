'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { authService } from '@/lib/auth';

const modules = [
  {
    title: 'Rekapan Internal Harian',
    description: 'Catat dan tinjau aktivitas operasional harian dengan cepat.',
    href: '/rekapan-internal-harian',
    icon: ClipboardList,
    accent: 'bg-amber-50 text-amber-700 ring-amber-100',
    number: '01',
  },
  {
    title: 'Rekapan Outgoing',
    description: 'Kelola data pengiriman keluar dan cari rekapan yang dibutuhkan.',
    href: '/rekapan-outgoing',
    icon: Package,
    accent: 'bg-sky-50 text-sky-700 ring-sky-100',
    number: '02',
  },
  {
    title: 'Rekapan Pengeluaran Harian',
    description: 'Catat transaksi pengeluaran dan pantau pencatatannya.',
    href: '/rekapan-pengeluaran-harian-outgoing',
    icon: Receipt,
    accent: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    number: '03',
  },
  {
    title: 'Rekapan Schedule',
    description: 'Kelola kehadiran dan lihat ringkasan schedule bulanan.',
    href: '/rekapan-schedule',
    icon: CalendarDays,
    accent: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    number: '04',
  },
  {
    title: 'Rekapan Gaji',
    description: 'Tinjau perhitungan gaji, kehadiran, bonus, dan kasbon.',
    href: '/rekapan-gaji',
    icon: Banknote,
    accent: 'bg-violet-50 text-violet-700 ring-violet-100',
    number: '05',
  },
  {
    title: 'Rekapan Kasbon',
    description: 'Pantau transaksi kasbon dan riwayat per karyawan.',
    href: '/rekapan-kasbon',
    icon: Wallet,
    accent: 'bg-rose-50 text-rose-700 ring-rose-100',
    number: '06',
  },
];

const roleLabel = (role?: string) => {
  if (role === 'admin') return 'Administrator';
  if (role === 'developer') return 'Developer';
  return 'Driver';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
};

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const visibleModules = useMemo(() => {
    if (currentUser?.role === 'driver') {
      return modules.filter((module) => ['/rekapan-internal-harian', '/rekapan-schedule'].includes(module.href));
    }
    return modules;
  }, [currentUser?.role]);

  const todayLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const userInitial = currentUser?.name?.trim()?.charAt(0)?.toLocaleUpperCase() || 'U';

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    toast('Anda telah keluar.', 'success');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sky-300 shadow-lg shadow-slate-900/10">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-slate-950">JNT REKAP</p>
              <p className="mt-0.5 text-xs text-slate-500">Portal operasional · BDG015A</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            {currentUser && (
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="max-w-44 truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{roleLabel(currentUser.role)}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6 lg:py-10">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10 lg:px-12">
          <div className="pointer-events-none absolute -right-16 -top-32 -z-10 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 right-1/3 -z-10 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-sky-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Dashboard operasional
              </div>
              <p className="mt-6 text-sm font-medium text-slate-300">{getGreeting()},</p>
              <h1 className="mt-1 break-words text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {currentUser?.name || 'Pengguna'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Semua area kerja dan pencatatan operasional tersedia di sini. Pilih modul untuk melanjutkan pekerjaan Anda.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-200 backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-sky-300" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-400">Hari ini</p>
                <p className="mt-0.5 font-semibold capitalize">{todayLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Ringkasan akses" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Modul yang dapat diakses</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{visibleModules.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Jenis akun</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{roleLabel(currentUser?.role)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ruang kerja</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">Rekap harian & operasional</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="modules-heading">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Navigasi</p>
              <h2 id="modules-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Pilih area kerja</h2>
              <p className="mt-1 text-sm text-slate-500">Buka modul yang sesuai untuk melihat atau mengelola rekapan.</p>
            </div>
            <span className="text-sm text-slate-500">{visibleModules.length} modul tersedia</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg hover:shadow-slate-900/5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${module.accent}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold tracking-wider text-slate-300">{module.number}</span>
                  </div>
                  <div className="mt-5 flex grow flex-col">
                    <h3 className="text-base font-semibold text-slate-900">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-sky-700">
                    <span>Buka modul</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Gunakan navigasi modul di atas untuk mengakses pencatatan sesuai kebutuhan operasional.</p>
          <div className="inline-flex items-center gap-2 font-medium text-slate-600">
            Akun aktif: {currentUser?.name || 'Pengguna'}
            <ArrowRight className="h-4 w-4 text-sky-600" aria-hidden="true" />
          </div>
        </footer>
      </div>
    </main>
  );
}
