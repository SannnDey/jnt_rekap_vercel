'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await authService.register(name, email, password);
      toast('Pendaftaran berhasil. Akun Anda akan menunggu persetujuan admin.', 'success');
      router.push('/login');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Registrasi gagal', 'error');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">JNT Rekap</p>
          <h1 className="text-3xl font-semibold text-white">Buat akun baru</h1>
          <p className="text-sm text-slate-400">Registrasi akun Anda, lalu tunggu persetujuan admin untuk mengakses sistem.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
              placeholder="Masukkan nama"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
              placeholder="nama@email.com"
              required
            />
          </div>
          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-sm text-white outline-none focus:border-sky-500"
              placeholder="Buat password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tunjukkan password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center text-slate-300 hover:text-white"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l18 18" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.94 10.94a3.5 3.5 0 0 0 4.95 4.95" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.88 5.46A9.97 9.97 0 0 1 12 5c4.48 0 8.27 2.94 9.54 7-1.02 3.28-3.44 5.78-6.48 6.86" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Daftar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-sky-300 hover:text-sky-200">
            Masuk di sini
          </Link>
        </div>
      </div>
    </main>
  );
}
