 'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ActivityStats from '@/components/ActivityStats';
import ActivityLogsTable from '@/components/ActivityLogsTable';
import { authService } from '@/lib/auth';

export default function ActivityLogsPage() {
  const router = useRouter();
  const [refreshStats, setRefreshStats] = useState(0);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!['developer', 'admin'].includes(user.role)) {
      router.replace('/');
      return;
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <Header 
        title="Activity Logs" 
        subtitle="Catatan aktivitas pengguna" 
        description="Lihat history tindakan pengguna di aplikasi."
        right={
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            ← Kembali
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-6 space-y-6">
        {/* Statistics Section */}
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">📊 Statistik Activity</h2>
          <ActivityStats refreshTrigger={refreshStats} />
        </section>

        {/* Activity Logs Section */}
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Activity Logs</h2>
          <p className="mt-2 text-sm text-slate-600">Menampilkan catatan aktivitas pengguna terakhir. Gunakan filter untuk mencari.</p>

          <div className="mt-6">
            <ActivityLogsTable onRefresh={() => setRefreshStats((prev) => prev + 1)} />
          </div>
        </section>
      </div>
    </main>
  );
}
