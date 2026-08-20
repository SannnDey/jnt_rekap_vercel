'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';

interface StatsData {
  totalLogs: number;
  todayLogs: number;
  unreadLogs: number;
  topActivityTypes: Array<{ type: string; count: number; icon: string }>;
  topUsers: Array<{ user: string; count: number }>;
}

interface ActivityStatsProps {
  refreshTrigger?: number;
}

export default function ActivityStats({ refreshTrigger }: ActivityStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/activity-logs/stats?period=${period}`);
        const json = await res.json();
        if (json?.success) {
          setStats(json.data);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [period, refreshTrigger]);

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">Periode:</span>
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              period === p
                ? 'bg-sky-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Logs Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Total Activity</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{formatNumber(stats.totalLogs)}</p>
            </div>
            <span className="text-3xl">📊</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">Total activity logs tercatat</p>
        </div>

        {/* Today Logs Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Hari Ini</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{formatNumber(stats.todayLogs)}</p>
            </div>
            <span className="text-3xl">📅</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">Activity hari ini</p>
        </div>

        {/* Unread Logs Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-600">Belum Dibaca</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{formatNumber(stats.unreadLogs)}</p>
            </div>
            <span className="text-3xl">🔔</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">Activity yang belum dibaca</p>
        </div>
      </div>

      {/* Activity Type Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">📈 Aktivitas Berdasarkan Tipe</h3>
        <div className="space-y-3">
          {stats.topActivityTypes.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada data</p>
          ) : (
            stats.topActivityTypes.map((item, idx) => {
              const percentage = stats.totalLogs > 0 ? (item.count / stats.totalLogs) * 100 : 0;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-sm font-medium text-slate-700">{item.type}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{item.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Users */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">👥 Top Users (Activity Count)</h3>
        {stats.topUsers.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada data</p>
        ) : (
          <div className="space-y-2">
            {stats.topUsers.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-200 text-xs font-semibold text-sky-700">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{item.user || '–'}</span>
                </div>
                <span className="text-xs font-bold text-sky-600">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
