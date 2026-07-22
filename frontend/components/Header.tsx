'use client';

export default function Header() {
  return (
    <header className="relative z-10 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-sky-300">JNT Rekap</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Sistem Rekap Outgoing Barang</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">Kelola pengiriman dan lihat ringkasan operasional secara lebih cepat dan visual.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200 shadow-sm backdrop-blur-sm">
          <p className="font-semibold">Versi 1.0</p>
          <p className="mt-1">© JNT Rekap</p>
        </div>
      </div>
    </header>
  );
}
