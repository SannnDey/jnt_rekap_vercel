'use client';

import { useState, useEffect } from 'react';
import { useInternalList, useDeleteInternal } from '@/hooks/useInternal';
import { formatDate, formatNumber, getFriendlyErrorMessage } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';

interface InternalTableProps {
  searchTerm: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  refreshKey: number;
  onPageChange: (page: number) => void;
  onEdit: (id: string) => void;
  onDataChange: () => void;
  readOnly?: boolean;
  highlightId?: string | null;
}

export default function InternalTable({
  searchTerm,
  startDate,
  endDate,
  currentPage,
  refreshKey,
  onPageChange,
  onEdit,
  onDataChange,
  readOnly = false,
  highlightId = null,
}: InternalTableProps) {
  const { data, isLoading, isError, error } = useInternalList(
    currentPage,
    10,
    searchTerm || undefined,
    startDate || undefined,
    endDate || undefined,
    refreshKey
  );
  const deleteMutation = useDeleteInternal();
  const { toast } = useToast();
  const confirm = useConfirm();

  

  const handleDelete = async (item: any) => {
    const ok = await confirm('Apakah Anda yakin ingin menghapus rekapan internal ini?');
    if (!ok) return;

    try {
      await deleteMutation.mutateAsync(item.id);
      onDataChange();
      const itemLabel = `📋 ${item.waybill || 'Item'}`;
      toast(`🗑️ ${itemLabel}`, 'success');
    } catch (err) {
      toast(getFriendlyErrorMessage(err), 'error');
    }
  };

  const items = data?.data || [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`row-${highlightId}`);
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-sky-300', 'bg-sky-50');
      const t = setTimeout(() => {
        el.classList.remove('ring-4', 'ring-sky-300', 'bg-sky-50');
      }, 3200);
      return () => clearTimeout(t);
    } catch (e) {
      // ignore
    }
  }, [highlightId, items]);

  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm text-center text-slate-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-sm">Memuat data internal...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
        <p className="font-semibold">Terjadi kesalahan saat memuat data.</p>
        <p className="mt-2 text-sm">{getFriendlyErrorMessage(error)}</p>
      </div>
    );
  }
  

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm text-center text-slate-500">
        <p>Tidak ada data rekapan internal ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-slate-600 uppercase tracking-[0.12em]">
            <tr>
              <th className="px-5 py-4 text-left font-semibold">Tanggal Rekap</th>
              <th className="px-5 py-4 text-left font-semibold">Waybill</th>
              <th className="px-5 py-4 text-left font-semibold">Sprinter</th>
              <th className="px-5 py-4 text-center font-semibold">Koli</th>
              <th className="px-5 py-4 text-right font-semibold">COD</th>
              <th className="px-5 py-4 text-right font-semibold">DFOD</th>
              {!readOnly && <th className="px-5 py-4 text-center font-semibold">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item: any, idx: number) => (
              <tr id={`row-${item.id}`} key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-5 py-4 text-slate-900">{formatDate(item.tanggalRekap)}</td>
                <td className="px-5 py-4 text-slate-900 font-medium tracking-tight">{item.waybill}</td>
                <td className="px-5 py-4 text-slate-900">{item.sprinterDelivery}</td>
                <td className="px-5 py-4 text-center text-slate-900">{item.jumlahKoli}</td>
                <td className="px-5 py-4 text-right text-slate-900">{formatNumber(item.jumlahPembayaranCOD)}</td>
                <td className="px-5 py-4 text-right text-slate-900">{formatNumber(item.biayaDFOD)}</td>
                {!readOnly && (
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => onEdit(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition hover:bg-sky-100">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100">
                        Hapus
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Halaman {pagination.page} dari {pagination.totalPages} • Total {pagination.total} data
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = pagination.page - 2 + i;
              if (pageNum < 1 || pageNum > pagination.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    pageNum === pagination.page
                      ? 'bg-sky-600 text-white border border-sky-600'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
