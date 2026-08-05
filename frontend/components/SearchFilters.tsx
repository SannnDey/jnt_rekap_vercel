'use client';

import { Search } from 'lucide-react';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  provinsi: string;
  onProvinsiChange: (value: string) => void;
  metodePembayaran: string;
  onMetodeChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc' | '';
  onSortOrderChange: (value: 'asc' | 'desc' | '') => void;
}

export default function SearchFilters({
  searchTerm,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  provinsi,
  onProvinsiChange,
  metodePembayaran,
  onMetodeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: SearchFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-2">Cari Waybill / Provinsi / Barang</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Masukkan kata kunci pencarian..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Akhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
        <div className="grid w-full gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Provinsi</label>
            <input
              type="text"
              value={provinsi}
              onChange={(e) => onProvinsiChange(e.target.value)}
              placeholder="Semua provinsi"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Metode Pembayaran</label>
            <select
              value={metodePembayaran}
              onChange={(e) => onMetodeChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Semua metode</option>
              <option value="TRANSFER">Transfer</option>
              <option value="CASH">Cash</option>
              <option value="TF_CASH">TF Cash</option>
              <option value="PICKUP_ONLINE">Pickup Online</option>
              <option value="BULANAN">Bulan</option>
              <option value="DFOD">DFOD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Urutkan berdasarkan</label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Default</option>
              <option value="tanggal">Tanggal</option>
              <option value="total">Total</option>
              <option value="provinsi">Provinsi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Arah Sort</label>
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc' | '')}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Default</option>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {(searchTerm || startDate || endDate) && (
        <button
          onClick={() => {
            onSearchChange('');
            onStartDateChange('');
            onEndDateChange('');
          }}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          Bersihkan semua filter
        </button>
      )}
    </div>
  );
}
