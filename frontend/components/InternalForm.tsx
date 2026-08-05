'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInternalById, useCreateInternal, useUpdateInternal } from '@/hooks/useInternal';
import type {
  CreateRekapanInternalInput,
  UpdateRekapanInternalInput,
} from '../types/internal';
import { getFriendlyErrorMessage } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

interface InternalFormProps {
  editingId?: string | null;
  onClose: () => void;
  onDataChange: () => void;
}

export default function InternalForm({ editingId, onClose, onDataChange }: InternalFormProps) {
  const [formData, setFormData] = useState<CreateRekapanInternalInput>({
    tanggalRekap: new Date().toISOString().slice(0, 10),
    waybill: '',
    jumlahKoli: 1,
    sprinterDelivery: '',
    jumlahPembayaranCOD: 0,
    biayaDFOD: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data: editData, isLoading: isLoadingEdit } = useInternalById(editingId || null);
  const createMutation = useCreateInternal();
  const updateMutation = useUpdateInternal();
  const { toast } = useToast();

  useEffect(() => {
    if (editData?.data) {
      const item = editData.data;
      setFormData({
        tanggalRekap: item.tanggalRekap,
        waybill: item.waybill,
        jumlahKoli: item.jumlahKoli,
        sprinterDelivery: item.sprinterDelivery,
        jumlahPembayaranCOD: item.jumlahPembayaranCOD,
        biayaDFOD: item.biayaDFOD,
      });
    }
  }, [editData]);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue =
      ['jumlahKoli', 'jumlahPembayaranCOD', 'biayaDFOD'].includes(name)
        ? parseInt(value, 10) || 0
        : value;

    setFormData((prev: CreateRekapanInternalInput) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const validateForm = (): string[] => {
    const missing: string[] = [];
    const nextErrors: Record<string, string> = {};

    if (!formData.tanggalRekap || String(formData.tanggalRekap).trim() === '') {
      missing.push('Tanggal Rekap');
      nextErrors.tanggalRekap = 'Tanggal Rekap tidak boleh kosong';
    }
    if (!formData.waybill.trim()) {
      missing.push('Waybill');
      nextErrors.waybill = 'Waybill tidak boleh kosong';
    }
    if (!formData.sprinterDelivery.trim()) {
      missing.push('Sprinter Delivery');
      nextErrors.sprinterDelivery = 'Sprinter Delivery tidak boleh kosong';
    }
    if (!formData.jumlahKoli || formData.jumlahKoli < 1) {
      missing.push('Jumlah Koli');
      nextErrors.jumlahKoli = 'Jumlah Koli harus lebih besar dari 0';
    }
    if (formData.jumlahPembayaranCOD < 0) {
      missing.push('Jumlah Pembayaran COD');
      nextErrors.jumlahPembayaranCOD = 'Nilai COD tidak boleh negatif';
    }
    if (formData.biayaDFOD < 0) {
      missing.push('Biaya DFOD');
      nextErrors.biayaDFOD = 'Biaya DFOD tidak boleh negatif';
    }

    setErrors(nextErrors);
    return missing;
  };

  const handleSubmit = async () => {
    const missing = validateForm();
    if (missing.length > 0) {
      toast(`Periksa kembali field: ${missing.join(', ')}`, 'error');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast('Rekapan internal berhasil diperbarui.', 'success');
      } else {
        await createMutation.mutateAsync(formData);
        toast('Rekapan internal berhasil ditambahkan.', 'success');
      }
      onDataChange();
      queryClient.invalidateQueries({ queryKey: ['rekapan-internal-summary'] });
      onClose();
    } catch (error) {
      toast(getFriendlyErrorMessage(error), 'error');
    }
  };

  if (isLoadingEdit && editingId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Memuat data editor...</h2>
                <p className="mt-1 text-sm text-slate-600">Tunggu sebentar saat data rekapan dimuat.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
          <div className="p-8 text-center text-slate-500">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            Sedang memuat...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{editingId ? 'Edit Rekapan Internal' : 'Tambah Rekapan Internal'}</h2>
              <p className="mt-1 text-sm text-slate-600">Simpan informasi internal harian dengan detail yang diperlukan.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-6 py-6 sm:px-8 min-h-0">
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700">Tanggal Rekap</label>
              <input
                name="tanggalRekap"
                type="date"
                value={formData.tanggalRekap ?? ''}
                onChange={handleChange}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.tanggalRekap ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'
                }`}
              />
              {errors.tanggalRekap ? <p className="mt-1 text-xs text-rose-600">{errors.tanggalRekap}</p> : null}
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700">Waybill</label>
              <input
                ref={firstInputRef}
                name="waybill"
                value={formData.waybill}
                onChange={handleChange}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.waybill ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'
                }`}
              />
              {errors.waybill ? <p className="mt-1 text-xs text-rose-600">{errors.waybill}</p> : null}
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700">Sprinter Delivery</label>
              <input
                name="sprinterDelivery"
                value={formData.sprinterDelivery}
                onChange={handleChange}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.sprinterDelivery ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'
                }`}
              />
              {errors.sprinterDelivery ? <p className="mt-1 text-xs text-rose-600">{errors.sprinterDelivery}</p> : null}
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700">Jumlah Koli</label>
              <input
                name="jumlahKoli"
                type="number"
                min={1}
                value={formData.jumlahKoli}
                onChange={handleChange}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.jumlahKoli ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'
                }`}
              />
              {errors.jumlahKoli ? <p className="mt-1 text-xs text-rose-600">{errors.jumlahKoli}</p> : null}
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-slate-700">Jumlah Pembayaran COD</label>
              <input
                name="jumlahPembayaranCOD"
                type="number"
                min={0}
                value={formData.jumlahPembayaranCOD}
                onChange={handleChange}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.jumlahPembayaranCOD ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'
                }`}
              />
              {errors.jumlahPembayaranCOD ? <p className="mt-1 text-xs text-rose-600">{errors.jumlahPembayaranCOD}</p> : null}
            </div>
            <div className="md:col-span-2 flex flex-col">
              <label className="block text-sm font-semibold text-slate-700">Biaya DFOD</label>
              <input
                name="biayaDFOD"
                type="number"
                min={0}
                value={formData.biayaDFOD}
                onChange={handleChange}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${
                  errors.biayaDFOD ? 'border-rose-500 bg-rose-50' : 'border-slate-300 bg-slate-50'
                }`}
              />
              {errors.biayaDFOD ? <p className="mt-1 text-xs text-rose-600">{errors.biayaDFOD}</p> : null}
            </div>
            <div className="md:col-span-2 flex flex-col gap-3 items-end justify-end pt-4 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-3xl border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:w-auto"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60 sm:w-auto"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Menyimpan...'
                  : editingId
                  ? 'Perbarui Rekapan'
                  : 'Simpan Rekapan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
