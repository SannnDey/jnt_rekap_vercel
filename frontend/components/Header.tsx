'use client';

import { ReactNode } from 'react';
import ActivityBell from './ActivityBell';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  right?: ReactNode;
}

export default function Header({
  title = 'Sistem Rekap Outgoing Barang',
  subtitle = 'Ringkasan Operasional',
  description = 'Kelola pengiriman dan lihat ringkasan operasional secara lebih cepat dan visual.',
  right,
}: HeaderProps) {
  return (
    <header className="relative z-10 bg-slate-950 text-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 px-4 py-6 md:flex-row md:items-center md:justify-between lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-sky-300">JNT Rekap</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm font-semibold text-slate-200">{subtitle}</p> : null}
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/10 px-5 py-4 text-sm text-slate-200 shadow-glow backdrop-blur-xl flex items-center gap-3">
          <ActivityBell />
          {right ? right : (
            <>
              <p className="font-semibold text-white">Versi 1.0</p>
              <p className="mt-1 text-slate-300">© JNT Rekap</p>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
