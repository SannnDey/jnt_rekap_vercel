"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { formatActivitySummary, formatRelativeTime, getActivityTypeInfo } from '@/lib/utils';

interface LogItem {
  id: string;
  type: string;
  details?: string | null;
  user?: string | null;
  createdAt: string;
  read?: boolean;
}

export default function ActivityBell() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<any[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/activity-logs?limit=6');
        const json = await res.json();
        if (!mounted) return;
        if (json?.success) setLogs(json.data || []);
        // mark displayed logs as read
        try {
          const idsToMark = (json?.data || []).filter((x: any) => !x.read).map((x: any) => x.id);
          if (idsToMark.length > 0) {
            await fetch('/api/activity-logs/mark-read', { method: 'POST', body: JSON.stringify({ ids: idsToMark }), headers: { 'Content-Type': 'application/json' } });
            // refresh unread count
            const r2 = await fetch('/api/activity-logs/unread-count');
            const j2 = await r2.json();
            if (j2?.success) setUnreadCount(j2.unread || 0);
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/activity-logs/unread-count');
        const json = await res.json();
        if (!mounted) return;
        if (json?.success) setUnreadCount(json.unread || 0);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // SSE for real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const es = new EventSource('/api/activity-logs/stream');
      esRef.current = es;
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === 'ping') return;
          // add to top of logs and toasts
          setLogs((prev) => [data, ...prev].slice(0, 50));
          setToasts((prev) => [{ id: data.id, type: data.type, details: data.details, createdAt: data.createdAt }, ...prev].slice(0, 6));
          setUnreadCount((c) => c + 1);
        } catch (e) {
          // ignore
        }
      };
      es.onerror = () => {
        try { es.close(); } catch (e) {}
      };
      return () => { try { es.close(); } catch (e) {} };
    } catch (e) {
      // ignore
    }
  }, []);

  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  const clearDetails = async (id: string) => {
    try {
      await fetch('/api/activity-logs/clear-details', { method: 'POST', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
      setLogs((prev) => prev.map((r) => r.id === id ? { ...r, details: null } : r));
      setToasts((prev) => prev.map((r) => r.id === id ? { ...r, details: null } : r));
    } catch (e) {
      // ignore
    }
  };

  const user = typeof window !== 'undefined' ? authService.getCurrentUser() : null;
  if (!user || !['developer', 'admin'].includes(user.role)) return null;

  useEffect(() => setMounted(true), []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Activity logs"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-xs font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Activity</p>
              <p className="text-xs text-slate-500">Aktivitas terbaru pengguna</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-sm text-slate-500">Tutup</button>
          </div>
          <div className="max-h-64 overflow-y-auto px-3 py-2">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Memuat...</div>
            ) : logs.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Belum ada aktivitas.</div>
            ) : (
              <ul className="space-y-2">
                {logs.map((l) => {
                  const typeInfo = getActivityTypeInfo(l.type);
                  return (
                    <li key={l.id} className={`rounded-lg px-3 py-2 transition-colors ${l.read ? '' : 'bg-sky-50'} hover:bg-slate-50`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span>{typeInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold ${typeInfo.color}`}>{typeInfo.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(l.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        {l.user ? <span className="font-medium">{l.user}</span> : <span>–</span>}
                      </div>
                      <div className="mt-1 break-words text-xs text-slate-700">
                        {(() => {
                          try {
                            const parsed = typeof l.details === 'string' ? JSON.parse(l.details) : l.details;
                            if (parsed && typeof parsed === 'object' && parsed.changes && typeof parsed.changes === 'object') {
                              const changes = parsed.changes;
                              const changeCount = Object.keys(changes).length;
                              return <span className="font-medium">📝 {changeCount} perubahan</span>;
                            }
                          } catch (e) {
                            // fall back
                          }
                          return <span>{formatActivitySummary(l.type, typeof l.details === 'string' ? l.details : JSON.stringify(l.details))}</span>;
                        })()}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
            <Link href="/activity-logs" onClick={() => setOpen(false)} className="text-sm font-semibold text-sky-600">Lihat semua</Link>
          </div>
        </div>
      )}
      {/* toasts */}
      {mounted && typeof window !== 'undefined' && toasts.length > 0 && createPortal(
        <div className="fixed right-4 bottom-6 z-50 space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              id={t.id}
              type={t.type}
              details={t.details}
              createdAt={t.createdAt}
              onDismiss={() => dismissToast(t.id)}
              onClearDetails={() => clearDetails(t.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function ToastItem({ id, type, details, createdAt, onDismiss, onClearDetails }: any) {
  const [exiting, setExiting] = useState(false);
  const typeInfo = getActivityTypeInfo(type);

  useEffect(() => {
    const t = setTimeout(() => {
      setExiting(true);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => onDismiss?.(), 240);
    return () => clearTimeout(t);
  }, [exiting, onDismiss]);

  return (
    <div className={`w-80 rounded-lg bg-white shadow-lg ring-1 ring-slate-200 p-4 pointer-events-auto ${exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${typeInfo.bgColor} ${typeInfo.color}`}>
            <span>{typeInfo.icon}</span>
            <span>{typeInfo.label}</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 font-medium">{formatActivitySummary(type, typeof details === 'string' ? details : JSON.stringify(details))}</div>
          <div className="mt-1 text-xs text-slate-400">{formatRelativeTime(createdAt)}</div>
        </div>
        <button onClick={() => setExiting(true)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600 flex-shrink-0">✕</button>
      </div>
    </div>
  );
}

