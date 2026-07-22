'use client';

import { useRekapanList, useDeleteRekapan } from '@/hooks/useRekapan';
import { formatDate, formatCurrency, formatWeight, getFriendlyErrorMessage } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';
import { Trash2, Edit2 } from 'lucide-react';

interface RekapanTableProps {
  searchTerm: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  refreshKey: number;
  onPageChange: (page: number) => void;
  onEdit: (id: string) => void;
  onDataChange: () => void;
}

export default function RekapanTable({
  searchTerm,
  startDate,
  endDate,
  currentPage,
  refreshKey,
  onPageChange,
  onEdit,
  onDataChange,
}: RekapanTableProps) {
  const { data, isLoading, isError, error } = useRekapanList(
    currentPage,
    10,
    searchTerm || undefined,
    startDate || undefined,
    endDate || undefined,
    refreshKey
  );

  const deleteMutation = useDeleteRekapan();

  const { toast } = useToast();
  const confirm = useConfirm();

  const handleDelete = async (id: string) => {
    const ok = await confirm('Apakah Anda yakin ingin menghapus rekapan ini?');
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
      onDataChange();
      toast('Rekapan berhasil dihapus.', 'success');
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      toast(message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm text-center text-slate-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-sm">Memuat data rekapan...</p>
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

  const items = (data?.data as any) || [];
  const pagination = (data?.pagination as any);

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm text-center text-slate-500">
        <p>Tidak ada data rekapan ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-slate-600 uppercase tracking-[0.12em]">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Tanggal</th>
              <th className="px-6 py-4 text-left font-semibold">Waybill</th>
              <th className="px-6 py-4 text-left font-semibold">Provinsi</th>
              <th className="px-6 py-4 text-left font-semibold">Jenis Barang</th>
              <th className="px-6 py-4 text-center font-semibold">Koli</th>
              <th className="px-6 py-4 text-center font-semibold">Berat</th>
              <th className="px-6 py-4 text-right font-semibold">Ongkir</th>
              <th className="px-6 py-4 text-right font-semibold">Asuransi</th>
              <th className="px-6 py-4 text-right font-semibold">Packing</th>
              <th className="px-6 py-4 text-right font-semibold">Total</th>
              <th className="px-6 py-4 text-center font-semibold">Metode</th>
              <th className="px-6 py-4 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item: any, idx: number) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-6 py-4 text-slate-900">{formatDate(item.tanggal)}</td>
                <td className="px-6 py-4 text-slate-900 font-medium tracking-tight">{item.waybill}</td>
                <td className="px-6 py-4 text-slate-900">{item.provinsi}</td>
                <td className="px-6 py-4 text-slate-900">{item.jenisBarang}</td>
                <td className="px-6 py-4 text-center text-slate-900">{item.jumlahKoli}</td>
                <td className="px-6 py-4 text-center text-slate-900">{formatWeight(item.beratKg)}</td>
                <td className="px-6 py-4 text-right text-slate-900">{formatCurrency(item.ongkir)}</td>
                <td className="px-6 py-4 text-right text-slate-900">{formatCurrency(item.asuransi)}</td>
                <td className="px-6 py-4 text-right text-slate-900">{formatCurrency(item.packing)}</td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    {item.metodePembayaran}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => onEdit(item.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
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
