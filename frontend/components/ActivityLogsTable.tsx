 'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatActivitySummary, formatRelativeTime, getActivityTypeInfo, type ActivityTypeInfo } from '@/lib/utils';
import ActivityFilters, { type ActivityFilterState } from './ActivityFilters';

interface LogItem {
  id: string;
  type: string;
  details?: string | null;
  user?: string | null;
  createdAt: string;
  read?: boolean;
}

export default function ActivityLogsTable({ initialPage = 1, onRefresh }: { initialPage?: number; onRefresh?: () => void }) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(50);
  const [rows, setRows] = useState<LogItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ActivityFilterState>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (search) params.set('search', search);
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.set('dateTo', filters.dateTo);
        if (filters.typeFilter) params.set('type', filters.typeFilter);
        if (filters.userFilter) params.set('user', filters.userFilter);
        if (filters.onlyUnread) params.set('unread', '1');
        
        const res = await fetch(`/api/activity-logs?${params.toString()}`);
        const json = await res.json();
        if (json?.success) {
          setRows(json.data || []);
          setTotal(json.pagination?.total ?? 0);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    return () => controller.abort();
  }, [page, limit, search, filters]);

  const clearDetails = async (id: string) => {
    try {
      await fetch('/api/activity-logs/clear-details', { method: 'POST', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, details: null } : r));
    } catch (e) {
      // ignore
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderActivityDetails = (logItem: LogItem) => {
    try {
      const parsed = typeof logItem.details === 'string' ? JSON.parse(logItem.details) : logItem.details;
      if (!parsed || typeof parsed !== 'object') return null;

      const changes = parsed.changes || {};
      const changeKeys = Object.keys(changes);
      if (changeKeys.length === 0) return null;

      return (
        <div className="space-y-2">
          {/* Related Entity Links */}
          {logItem.type?.startsWith('rekapan_internal') && (parsed.waybill || parsed.id) && (
            <div className="rounded-lg bg-purple-50 px-3 py-2">
              <Link href={`/rekapan-internal-harian?openId=${parsed.id ?? ''}`} className="text-sm font-medium text-purple-600 hover:underline">
                📋 Waybill: {parsed.waybill ?? parsed.id}
              </Link>
            </div>
          )}
          {logItem.type?.startsWith('rekapan') && !logItem.type?.startsWith('rekapan_internal') && (parsed.waybill || parsed.id) && (
            <div className="rounded-lg bg-green-50 px-3 py-2">
              <Link href={`/rekapan-outgoing?openId=${parsed.id ?? ''}`} className="text-sm font-medium text-green-600 hover:underline">
                📦 Waybill: {parsed.waybill ?? parsed.id}
              </Link>
            </div>
          )}

          {/* Changes Table */}
          {changeKeys.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Field</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Sebelum</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Sesudah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {changeKeys.map((k) => {
                    const c = changes[k];
                    let before: any = undefined;
                    let after: any = undefined;
                    if (c && typeof c === 'object' && ('before' in c || 'after' in c)) {
                      before = c.before;
                      after = c.after;
                    } else if (Array.isArray(c) && c.length >= 2) {
                      before = c[0];
                      after = c[1];
                    } else {
                      before = undefined;
                      after = c;
                    }
                    const beforeLabel = before === undefined || before === null || before === '' ? '–' : String(before);
                    const afterLabel = after === undefined || after === null ? '–' : String(after);
                    return (
                      <tr key={k} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{k}</td>
                        <td className="px-3 py-2 text-slate-600">
                          <span className="line-through">{beforeLabel}</span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{afterLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-2 flex gap-2">
            <button onClick={() => clearDetails(logItem.id)} className="text-xs text-rose-600 hover:text-rose-700 font-medium">
              🗑️ Hapus Detail
            </button>
          </div>
        </div>
      );
    } catch (e) {
      return null;
    }
  };



  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <ActivityFilters onFilterChange={setFilters} />

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tipe, user, atau detail..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <div className="text-sm font-medium text-slate-600">Total: <span className="text-sky-600">{total}</span></div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={async () => {
            const ids = Object.keys(selected).filter((k) => selected[k]);
            if (ids.length === 0) return;
            try {
              await fetch('/api/activity-logs/mark-read', { method: 'POST', body: JSON.stringify({ ids }), headers: { 'Content-Type': 'application/json' } });
              setSelected({});
              setPage(1);
            } catch (e) {}
          }}
          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          ✓ Tandai Dibaca
        </button>
        <button
          onClick={async () => {
            try {
              await fetch('/api/activity-logs/mark-read', { method: 'POST' });
              setPage(1);
            } catch (e) {}
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ✓ Tandai Semua Dibaca
        </button>
        <button
          onClick={async () => {
            const ids = Object.keys(selected).filter((k) => selected[k]);
            if (ids.length === 0) return;
            try {
              await fetch('/api/activity-logs/mark-unread', { method: 'POST', body: JSON.stringify({ ids }), headers: { 'Content-Type': 'application/json' } });
              setSelected({});
              setPage(1);
            } catch (e) {}
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          ○ Tandai Belum Dibaca
        </button>

      </div>

      {/* Activity Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="w-6 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && Object.keys(selected).filter((k) => selected[k]).length === rows.length}
                  onChange={(e) => {
                    const newSelected: Record<string, boolean> = {};
                    if (e.target.checked) {
                      rows.forEach((r) => (newSelected[r.id] = true));
                    }
                    setSelected(newSelected);
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">Waktu</th>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Tipe</th>
              <th className="px-4 py-3 text-left font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  ⏳ Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  📭 Tidak ada log yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const typeInfo = getActivityTypeInfo(r.type);
                const isExpanded = expandedDetails[r.id];
                return (
                  <tr key={r.id} className={`transition-colors ${r.read ? '' : 'bg-sky-50'} hover:bg-slate-50`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900">{formatRelativeTime(r.createdAt)}</span>
                        <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {r.user ?? '–'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-slate-700">
                            {formatActivitySummary(r.type, typeof r.details === 'string' ? r.details : JSON.stringify(r.details))}
                          </p>
                          {renderActivityDetails(r) && !isExpanded && (
                            <button
                              onClick={() => toggleDetails(r.id)}
                              className="mt-2 text-xs font-medium text-sky-600 hover:text-sky-700"
                            >
                              ▼ Lihat Detail
                            </button>
                          )}
                          {isExpanded && (
                            <div className="mt-3 space-y-2">
                              {renderActivityDetails(r)}
                              <button
                                onClick={() => toggleDetails(r.id)}
                                className="text-xs font-medium text-slate-600 hover:text-slate-700"
                              >
                                ▲ Sembunyikan Detail
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Halaman <span className="font-semibold text-sky-600">{page}</span> dari{' '}
          <span className="font-semibold text-sky-600">{Math.ceil(total / limit) || 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Sebelumnya
          </button>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya →
          </button>
        </div>
      </div>
    </div>
  );
}

