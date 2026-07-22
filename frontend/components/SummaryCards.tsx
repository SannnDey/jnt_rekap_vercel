'use client';

import { useRekapanSummary } from '@/hooks/useRekapan';
import { formatCurrency, formatNumber, formatWeight } from '@/lib/utils';
import { BarChart3, Package, Weight } from 'lucide-react';

interface SummaryCardsProps {
  startDate?: string;
  endDate?: string;
}

export default function SummaryCards({ startDate, endDate }: SummaryCardsProps) {
  const { data: summaryData, isLoading } = useRekapanSummary(
    startDate || undefined,
    endDate || undefined
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-[1.75rem] bg-slate-200 h-36 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const summary = summaryData?.data;

  if (!summary) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm mb-6 text-center text-slate-500">
        Ringkasan belum tersedia. Tambahkan atau muat ulang data untuk melihat statistik.
      </div>
    );
  }

  const periodLabel = startDate || endDate ? `${startDate || 'Awal'} - ${endDate || 'Sekarang'}` : 'Semua waktu';

  const cards = [
    {
      icon: BarChart3,
      label: 'Total Pengiriman',
      value: formatNumber(summary.totalCount),
      color: 'bg-sky-50 text-sky-700',
      iconColor: 'text-sky-600',
    },
    {
      icon: Package,
      label: 'Total Koli',
      value: formatNumber(summary.totalKoli),
      color: 'bg-emerald-50 text-emerald-700',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Weight,
      label: 'Total Berat',
      value: formatWeight(summary.totalWeight ?? 0),
      color: 'bg-amber-50 text-amber-700',
      iconColor: 'text-amber-600',
    },
  ];

  const costBreakdown = [
    {
      label: 'Total Ongkir',
      value: formatCurrency(summary.totalOngkir ?? 0),
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Total Asuransi',
      value: formatCurrency(summary.totalAsuransi ?? 0),
      color: 'bg-orange-50 text-orange-700',
    },
    {
      label: 'Total Packing',
      value: formatCurrency(summary.totalPacking ?? 0),
      color: 'bg-pink-50 text-pink-700',
    },
    {
      label: 'Total Keseluruhan',
      value: formatCurrency(summary.totalAmount),
      color: 'bg-violet-50 text-violet-700',
      isTotal: true,
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Ringkasan</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Statistik Pengiriman</h3>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Periode: {periodLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.color} rounded-[1.75rem] border border-slate-200 p-6 shadow-sm`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium opacity-90">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <Icon size={36} className={`${card.iconColor} opacity-20`} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {costBreakdown.map((item, idx) => (
          <div
            key={idx}
            className={`${item.color} rounded-[1.75rem] border border-slate-200 p-6 shadow-sm ${item.isTotal ? 'lg:col-span-1 lg:border-2' : ''}`}
          >
            <p className="text-sm font-medium opacity-90">{item.label}</p>
            <p className={`mt-4 ${item.isTotal ? 'text-4xl' : 'text-2xl'} font-semibold text-slate-900`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
