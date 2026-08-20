import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('DD MMM YYYY');
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD MMM YYYY HH:mm');
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

export const parseFormattedNumber = (value: string): string => {
  if (!value) return '';
  const normalized = String(value).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return '';
  return parsed.toFixed(0);
};

export const formatWeight = (kg: number): string => {
  // Always display weight in kilograms to match imported Excel data units
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kg)} kg`;
};

export const parseDate = (dateString: string): Date => {
  return dayjs(dateString).toDate();
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const getFriendlyErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Record<string, unknown>;
      if (typeof data.message === 'string' && data.message.length > 0) {
        return data.message
          .replace(/https?:\/\/[^\s]*/gi, '')
          .replace(/localhost[:\d]*/gi, '')
          .trim() || 'Terjadi kesalahan saat memproses permintaan.';
      }
    }

    if (error.message?.includes('Network Error') || error.code === 'ECONNREFUSED') {
      return 'Tidak dapat terhubung ke server. Silakan periksa koneksi dan coba lagi.';
    }

    return error.message
      .replace(/https?:\/\/[^\s]*/gi, '')
      .replace(/localhost[:\d]*/gi, '')
      .trim() || 'Terjadi kesalahan saat memproses permintaan.';
  }

  if (error instanceof Error) {
    return error.message
      .replace(/https?:\/\/[^\s]*/gi, '')
      .replace(/localhost[:\d]*/gi, '')
      .trim() || 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
  }

  return 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
};

export const computeExportMonthLabel = (month: string): string => {
  // month: YYYY-MM
  try {
    return dayjs(month + '-01').format('MMMM YYYY');
  } catch (e) {
    return month;
  }
};

export const getMonthRange = (month: string): { startDate: string; endDate: string } | null => {
  // month: YYYY-MM -> return start and end in YYYY-MM-DD
  if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) return null;
  const start = dayjs(month + '-01').startOf('month');
  const end = dayjs(month + '-01').endOf('month');
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
};

export const formatActivitySummary = (type: string, details?: string | null): string => {
  if (!details) return '-';
  let parsed: any = null;
  try { parsed = typeof details === 'string' ? JSON.parse(details) : details; } catch { parsed = details; }

  const v = (k: string) => parsed?.[k];

  const joinChanges = (obj: any) => {
    if (!obj || typeof obj !== 'object') return String(obj);
    const parts: string[] = [];
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (v && typeof v === 'object' && ('before' in v || 'after' in v)) {
        parts.push(`${k}: ${String(v.before ?? '')} → ${String(v.after ?? '')}`);
      } else if (Array.isArray(v) && v.length === 2) {
        parts.push(`${k}: ${String(v[0])} → ${String(v[1])}`);
      } else {
        parts.push(`${k}: ${String(v)}`);
      }
    }
    return parts.join(', ');
  };

  if (type.startsWith('rekapan')) {
    if (type.includes('create')) return `Tambah Rekapan ${v('waybill') ?? v('id') ?? ''} ${v('provinsi') ? `(${v('provinsi')})` : ''}`.trim();
    if (type.includes('update')) return `Update Rekapan ${v('waybill') ?? v('id')}: ${joinChanges(v('updates') ?? v('changes') ?? {})}`;
    if (type.includes('delete')) return `Hapus Rekapan ${v('waybill') ?? v('id')}`;
  }

  if (type.startsWith('rekapan_internal')) {
    if (type.includes('import')) return `Import internal: ${v('imported') ?? 0} baris`;
    if (type.includes('create')) return `Tambah Rekapan Internal ${v('waybill') ?? v('id')}`;
    if (type.includes('update')) return `Update Rekapan Internal ${v('waybill') ?? v('id')}: ${joinChanges(v('changes') ?? {})}`;
    if (type.includes('delete')) return `Hapus Rekapan Internal ${v('waybill') ?? v('id')}`;
  }

  if (type.startsWith('kasbon')) {
    if (v('amount') !== undefined) return `Kasbon ${v('employee') ?? ''} — ${formatCurrency(Number(v('amount')) ?? 0)}`;
    return `Kasbon: ${JSON.stringify(parsed)}`;
  }

  if (type.startsWith('pengeluaran')) {
    if (v('nominal') !== undefined) return `Pengeluaran ${v('jenis') ?? ''} — ${formatCurrency(Number(v('nominal')) ?? 0)}`;
    return `Pengeluaran: ${JSON.stringify(parsed)}`;
  }

  if (type.startsWith('schedule')) {
    if (type.includes('attendance')) {
      if (type.includes('create')) return `Kehadiran ${v('employeeName') ?? ''} pada ${formatDate(String(v('tanggal') ?? ''))}`;
      if (type.includes('update')) return `Update Kehadiran ${v('employeeName') ?? ''}: ${joinChanges(v('changes') ?? {})}`;
      if (type.includes('delete')) return `Hapus Kehadiran ${v('employeeName') ?? ''}`;
      return `${type} ${v('employeeName') ?? ''}`;
    }
    if (type.includes('employee')) return `Karyawan ${v('name') ?? ''} (${v('role') ?? ''})`;
  }

  try {
    const pretty = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
    return pretty.length > 300 ? pretty.slice(0, 300) + '…' : pretty;
  } catch {
    return String(details).slice(0, 300);
  }
};

export const computeFieldChanges = (existing: Record<string, any> | null, updated: Record<string, any> | null) => {
  if (!existing || !updated) return {};
  const out: Record<string, { before: any; after: any } | any[]> = {};
  for (const key of Object.keys(updated)) {
    const after = updated[key];
    const before = existing[key];
    if (after === undefined) continue;
    // normalize dates to ISO for comparison
    const beforeNorm = before instanceof Date ? before.toISOString() : before;
    const afterNorm = after instanceof Date ? after.toISOString() : after;
    if (JSON.stringify(beforeNorm) !== JSON.stringify(afterNorm)) {
      out[key] = { before: before === undefined ? null : before, after: after === undefined ? null : after };
    }
  }
  return out;
};

// Activity Log Helpers
export const formatRelativeTime = (date: string | Date): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target);

  if (diff < 1000 * 60) return 'Baru saja';
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} menit lalu`;
  if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))} jam lalu`;
  if (diff < 1000 * 60 * 60 * 24 * 7) return `${Math.floor(diff / (1000 * 60 * 60 * 24))} hari lalu`;
  
  return target.format('DD MMM YYYY HH:mm');
};

export interface ActivityTypeInfo {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}

export const getActivityTypeInfo = (type: string): ActivityTypeInfo => {
  const typeMap: Record<string, ActivityTypeInfo> = {
    // Rekapan types (Rekapan Outgoing)
    'rekapan.create': { icon: '📦', label: 'Buat Rekapan', color: 'text-green-600', bgColor: 'bg-green-50' },
    'rekapan.update': { icon: '✏️', label: 'Update Rekapan', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    'rekapan.delete': { icon: '🗑️', label: 'Hapus Rekapan', color: 'text-red-600', bgColor: 'bg-red-50' },
    
    // Rekapan Internal types (Rekapan Internal Harian)
    'rekapan_internal.create': { icon: '📋', label: 'Buat Rekapan Internal', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    'rekapan_internal.update': { icon: '✏️', label: 'Update Rekapan Internal', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    'rekapan_internal.delete': { icon: '🗑️', label: 'Hapus Rekapan Internal', color: 'text-red-600', bgColor: 'bg-red-50' },
    'rekapan_internal.import': { icon: '📥', label: 'Import Rekapan Internal', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    
    // Kasbon types
    'kasbon.create': { icon: '💵', label: 'Buat Kasbon', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    'kasbon.update': { icon: '💵', label: 'Update Kasbon', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    'kasbon.delete': { icon: '🗑️', label: 'Hapus Kasbon', color: 'text-red-600', bgColor: 'bg-red-50' },
    
    // Pengeluaran types (Rekapan Pengeluaran)
    'pengeluaran.create': { icon: '💰', label: 'Buat Pengeluaran', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    'pengeluaran.update': { icon: '💰', label: 'Update Pengeluaran', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    'pengeluaran.delete': { icon: '🗑️', label: 'Hapus Pengeluaran', color: 'text-red-600', bgColor: 'bg-red-50' },
    
    // Schedule/Attendance types (Rekapan Schedule)
    'schedule.attendance.create': { icon: '✅', label: 'Buat Kehadiran', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    'schedule.attendance.update': { icon: '✏️', label: 'Update Kehadiran', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    'schedule.attendance.delete': { icon: '🗑️', label: 'Hapus Kehadiran', color: 'text-red-600', bgColor: 'bg-red-50' },
    'schedule.employee': { icon: '👤', label: 'Data Karyawan', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  };

  // Check exact match first
  if (typeMap[type]) return typeMap[type];

  // Check by prefix for partial matches
  for (const [key, value] of Object.entries(typeMap)) {
    if (type.startsWith(key.replace(/_(create|update|delete|import)$/, ''))) {
      return value;
    }
  }

  // Default fallback
  if (type.includes('create')) return { icon: '➕', label: 'Buat', color: 'text-green-600', bgColor: 'bg-green-50' };
  if (type.includes('update')) return { icon: '✏️', label: 'Update', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  if (type.includes('delete')) return { icon: '🗑️', label: 'Hapus', color: 'text-red-600', bgColor: 'bg-red-50' };
  if (type.includes('import')) return { icon: '📥', label: 'Import', color: 'text-indigo-600', bgColor: 'bg-indigo-50' };

  return { icon: '📝', label: type, color: 'text-slate-600', bgColor: 'bg-slate-50' };
};
