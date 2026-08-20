'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export interface ActivityFilterState {
  dateFrom?: string;
  dateTo?: string;
  typeFilter?: string;
  userFilter?: string;
  onlyUnread?: boolean;
}

interface ActivityFiltersProps {
  onFilterChange: (filters: ActivityFilterState) => void;
  activityTypes?: string[];
  users?: string[];
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: 'rekapan_create', label: 'Buat Rekapan' },
  { value: 'rekapan_update', label: 'Update Rekapan' },
  { value: 'rekapan_delete', label: 'Hapus Rekapan' },
  { value: 'rekapan_internal_create', label: 'Buat Rekapan Internal' },
  { value: 'rekapan_internal_update', label: 'Update Rekapan Internal' },
  { value: 'rekapan_internal_delete', label: 'Hapus Rekapan Internal' },
  { value: 'rekapan_internal_import', label: 'Import Rekapan Internal' },
  { value: 'kasbon_create', label: 'Buat Kasbon' },
  { value: 'kasbon_update', label: 'Update Kasbon' },
  { value: 'kasbon_delete', label: 'Hapus Kasbon' },
  { value: 'pengeluaran_create', label: 'Buat Pengeluaran' },
  { value: 'pengeluaran_update', label: 'Update Pengeluaran' },
  { value: 'pengeluaran_delete', label: 'Hapus Pengeluaran' },
  { value: 'schedule_attendance_create', label: 'Buat Kehadiran' },
  { value: 'schedule_attendance_update', label: 'Update Kehadiran' },
];

const QUICK_DATE_RANGES = [
  { label: 'Hari ini', getValue: () => ({ dateFrom: dayjs().format('YYYY-MM-DD'), dateTo: dayjs().format('YYYY-MM-DD') }) },
  { label: 'Kemarin', getValue: () => ({ dateFrom: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), dateTo: dayjs().subtract(1, 'day').format('YYYY-MM-DD') }) },
  { label: '7 hari terakhir', getValue: () => ({ dateFrom: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), dateTo: dayjs().format('YYYY-MM-DD') }) },
  { label: '30 hari terakhir', getValue: () => ({ dateFrom: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dateTo: dayjs().format('YYYY-MM-DD') }) },
  { label: 'Bulan ini', getValue: () => ({ dateFrom: dayjs().startOf('month').format('YYYY-MM-DD'), dateTo: dayjs().endOf('month').format('YYYY-MM-DD') }) },
  { label: 'Bulan lalu', getValue: () => ({ dateFrom: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), dateTo: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD') }) },
];

export default function ActivityFilters({ onFilterChange, activityTypes = [], users = [] }: ActivityFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('');

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('activityFilters');
      if (saved) {
        const filters = JSON.parse(saved);
        setDateFrom(filters.dateFrom || '');
        setDateTo(filters.dateTo || '');
        setTypeFilter(filters.typeFilter || '');
        setUserFilter(filters.userFilter || '');
        setOnlyUnread(filters.onlyUnread || false);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save filters to localStorage and call onFilterChange
  const applyFilters = (
    df: string = dateFrom,
    dt: string = dateTo,
    tf: string = typeFilter,
    uf: string = userFilter,
    ou: boolean = onlyUnread
  ) => {
    const filters: ActivityFilterState = {};
    if (df) filters.dateFrom = df;
    if (dt) filters.dateTo = dt;
    if (tf) filters.typeFilter = tf;
    if (uf) filters.userFilter = uf;
    if (ou) filters.onlyUnread = ou;

    localStorage.setItem('activityFilters', JSON.stringify(filters));
    onFilterChange(filters);
  };

  const handleApplyPreset = (preset: typeof QUICK_DATE_RANGES[0]) => {
    const { dateFrom: df, dateTo: dt } = preset.getValue();
    setDateFrom(df);
    setDateTo(dt);
    setActivePreset(preset.label);
    applyFilters(df, dt, typeFilter, userFilter, onlyUnread);
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('');
    setUserFilter('');
    setOnlyUnread(false);
    setActivePreset('');
    localStorage.removeItem('activityFilters');
    onFilterChange({});
  };

  const handleApplyFilters = () => {
    applyFilters();
    setExpanded(false);
  };

  const activeFilterCount = [dateFrom, dateTo, typeFilter, userFilter, onlyUnread].filter(Boolean).length;

  return (
    <div className="mb-4 space-y-3">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span>🔍 Filter</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        
        {activeFilterCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center rounded-full border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {expanded && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Quick Date Range Presets */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-slate-600 uppercase">Rentang Cepat</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_DATE_RANGES.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleApplyPreset(preset)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    activePreset === preset.label
                      ? 'bg-sky-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Activity Type Filter */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Tipe Aktivitas</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Semua Tipe</option>
              {ACTIVITY_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-slate-600">User</label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Cari nama user..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Only Unread Checkbox */}
          <div className="mb-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              <span className="text-sm text-slate-700">Hanya yang belum dibaca</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={handleApplyFilters}
              className="flex-1 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Terapkan Filter
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
