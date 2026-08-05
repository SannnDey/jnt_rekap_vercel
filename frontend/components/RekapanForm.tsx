'use client';

import { useState, useEffect, useRef } from 'react';
import { useRekapanById, useCreateRekapan, useUpdateRekapan } from '@/hooks/useRekapan';
import { CreateRekapanInput, MetodePembayaran } from '@/types';
import { getFriendlyErrorMessage, formatDate, formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
// using emoji for the confirm icon to avoid extra icon dependency issues

interface RekapanFormProps {
  editingId?: string | null;
  onClose: () => void;
  onDataChange: () => void;
}

export default function RekapanForm({ editingId, onClose, onDataChange }: RekapanFormProps) {
  const [formData, setFormData] = useState<CreateRekapanInput>({
    tanggal: new Date(),
    waybill: '',
    provinsi: '',
    jenisBarang: '',
    jumlahKoli: 1,
    beratKg: 1,
    ongkir: 0,
    asuransi: 0,
    packing: 0,
    metodePembayaran: MetodePembayaran.TRANSFER,
  });

  const { data: editData, isLoading: isLoadingEdit } = useRekapanById(editingId || null);
  const createMutation = useCreateRekapan();
  const updateMutation = useUpdateRekapan();

  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editData?.data) {
      const item = editData.data;
      setFormData({
        tanggal: new Date(item.tanggal),
        waybill: item.waybill,
        provinsi: item.provinsi,
        jenisBarang: item.jenisBarang,
        jumlahKoli: item.jumlahKoli,
        beratKg: item.beratKg,
        ongkir: item.ongkir,
        asuransi: item.asuransi,
        packing: item.packing,
        metodePembayaran: item.metodePembayaran,
      });
    }
  }, [editData]);

  useEffect(() => {
    // autofocus first input when form mounts
    if (firstInputRef.current) {
      try {
        firstInputRef.current.focus();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const { toast } = useToast();

  const submitExec = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: formData,
        });
        toast('Perubahan rekapan berhasil disimpan.', 'success');
      } else {
        await createMutation.mutateAsync(formData);
        toast('Rekapan baru berhasil ditambahkan.', 'success');
      }
      onDataChange();
      onClose();
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      toast(message, 'error');
    } finally {
      setShowConfirm(false);
      setErrors({});
    }
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    // Only validate strictly for create (when not editing)
    if (!editingId) {
      const missing = validateForm();
      if (missing.length > 0) {
        toast(`Harap lengkapi field: ${missing.join(', ')}`);
        // focus first error field
        const firstKey = missing[0];
        if (firstKey === 'Waybill' && firstInputRef.current) firstInputRef.current.focus();
        return;
      }
    }

    setShowConfirm(true);
  };

  const validateForm = (): string[] => {
    const missing: string[] = [];

    if (!formData.tanggal || !(formData.tanggal instanceof Date) || isNaN(formData.tanggal.getTime())) {
      missing.push('Tanggal');
    }
    if (!formData.waybill || String(formData.waybill).trim() === '') missing.push('Waybill');
    if (!formData.provinsi || String(formData.provinsi).trim() === '') missing.push('Provinsi');
    if (!formData.jenisBarang || String(formData.jenisBarang).trim() === '') missing.push('Jenis Barang');
    if (formData.jumlahKoli == null || Number(formData.jumlahKoli) <= 0) missing.push('Jumlah Koli');
    if (formData.beratKg == null || Number(formData.beratKg) <= 0) missing.push('Berat (Kg)');
    // ongkir, asuransi, packing can be zero but must be present (not null)
    if (formData.ongkir == null) missing.push('Ongkir');
    if (formData.asuransi == null) missing.push('Asuransi');
    if (formData.packing == null) missing.push('Packing');
    if (!formData.metodePembayaran) missing.push('Metode Pembayaran');

    // set errors map for UI highlighting
    const map: Record<string, string> = {};
    missing.forEach((m) => {
      // map field titles to field keys
      if (m === 'Tanggal') map['tanggal'] = m;
      if (m === 'Waybill') map['waybill'] = m;
      if (m === 'Provinsi') map['provinsi'] = m;
      if (m === 'Jenis Barang') map['jenisBarang'] = m;
      if (m === 'Jumlah Koli') map['jumlahKoli'] = m;
      if (m === 'Berat (Kg)') map['beratKg'] = m;
      if (m === 'Ongkir') map['ongkir'] = m;
      if (m === 'Asuransi') map['asuransi'] = m;
      if (m === 'Packing') map['packing'] = m;
      if (m === 'Metode Pembayaran') map['metodePembayaran'] = m;
    });
    setErrors(map);
    return missing;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    const parsedValue =
      name === 'tanggal'
        ? new Date(value)
        : name === 'beratKg'
        ? parseFloat(value) || 0
        : ['jumlahKoli'].includes(name)
        ? parseInt(value, 10) || 0
        : ['ongkir', 'asuransi', 'packing'].includes(name)
        ? Number(parseFormattedNumber(value) || 0)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const originalValues = editData?.data
    ? {
        tanggal: new Date(editData.data.tanggal),
        waybill: editData.data.waybill,
        provinsi: editData.data.provinsi,
        jenisBarang: editData.data.jenisBarang,
        jumlahKoli: editData.data.jumlahKoli,
        beratKg: editData.data.beratKg,
        ongkir: editData.data.ongkir,
        asuransi: editData.data.asuransi,
        packing: editData.data.packing,
        metodePembayaran: editData.data.metodePembayaran,
      }
    : null;

  const changedFields = originalValues
    ? {
        tanggal: formData.tanggal.getTime() !== originalValues.tanggal.getTime(),
        waybill: formData.waybill !== originalValues.waybill,
        provinsi: formData.provinsi !== originalValues.provinsi,
        jenisBarang: formData.jenisBarang !== originalValues.jenisBarang,
        jumlahKoli: formData.jumlahKoli !== originalValues.jumlahKoli,
        beratKg: formData.beratKg !== originalValues.beratKg,
        ongkir: formData.ongkir !== originalValues.ongkir,
        asuransi: formData.asuransi !== originalValues.asuransi,
        packing: formData.packing !== originalValues.packing,
        metodePembayaran: formData.metodePembayaran !== originalValues.metodePembayaran,
      }
    : null;

  if (isLoadingEdit && editingId) {
    return <div className="rounded-[1.5rem] bg-white p-6 shadow-sm text-center text-slate-500">Memuat data editor...</div>;
  }

  return (
    <div className="flex flex-col bg-white min-h-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit Rekapan' : 'Tambah Rekapan Baru'}</h3>
            <p className="mt-1 text-sm text-slate-500">Isi data pengiriman dengan lengkap untuk menambahkan atau memperbarui rekapan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-6 py-6 sm:px-8 min-h-0">
        <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Tanggal *</label>
            <input
              type="date"
              name="tanggal"
              value={formData.tanggal.toISOString().split('T')[0]}
              onChange={handleChange}
              required
              className={
                errors['tanggal']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['tanggal'] ? <div className="mt-1 text-xs text-red-600">{errors['tanggal']} wajib diisi.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Waybill *</label>
            <input
              type="text"
              name="waybill"
              value={formData.waybill}
              onChange={handleChange}
              ref={firstInputRef}
              required
              className={
                errors['waybill']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['waybill'] ? <div className="mt-1 text-xs text-red-600">{errors['waybill']} wajib diisi.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Provinsi *</label>
            <input
              type="text"
              name="provinsi"
              value={formData.provinsi}
              onChange={handleChange}
              required
              className={
                errors['provinsi']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['provinsi'] ? <div className="mt-1 text-xs text-red-600">{errors['provinsi']} wajib diisi.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Jenis Barang *</label>
            <input
              type="text"
              name="jenisBarang"
              value={formData.jenisBarang}
              onChange={handleChange}
              required
              className={
                errors['jenisBarang']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['jenisBarang'] ? <div className="mt-1 text-xs text-red-600">{errors['jenisBarang']} wajib diisi.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Jumlah Koli *</label>
            <input
              type="number"
              name="jumlahKoli"
              min="1"
              value={formData.jumlahKoli}
              onChange={handleChange}
              required
              className={
                errors['jumlahKoli']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['jumlahKoli'] ? <div className="mt-1 text-xs text-red-600">{errors['jumlahKoli']} wajib diisi atau lebih besar dari nol.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Berat (Kg) *</label>
            <input
              type="number"
              name="beratKg"
              min="0.1"
              step="0.1"
              value={formData.beratKg}
              onChange={handleChange}
              required
              className={
                errors['beratKg']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['beratKg'] ? <div className="mt-1 text-xs text-red-600">{errors['beratKg']} wajib diisi atau lebih besar dari nol.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Ongkir *</label>
            <input
              type="text"
              inputMode="numeric"
              name="ongkir"
              value={formatNumber(formData.ongkir)}
              onChange={handleChange}
              required
              className={
                errors['ongkir']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['ongkir'] ? <div className="mt-1 text-xs text-red-600">{errors['ongkir']} wajib diisi.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Asuransi</label>
            <input
              type="text"
              inputMode="numeric"
              name="asuransi"
              value={formatNumber(formData.asuransi)}
              onChange={handleChange}
              className={
                errors['asuransi']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['asuransi'] ? <div className="mt-1 text-xs text-red-600">{errors['asuransi']} wajib diisi.</div> : null}
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700">Packing</label>
            <input
              type="text"
              inputMode="numeric"
              name="packing"
              value={formatNumber(formData.packing)}
              onChange={handleChange}
              className={
                errors['packing']
                  ? 'mt-2 w-full rounded-2xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            />
            {errors['packing'] ? <div className="mt-1 text-xs text-red-600">{errors['packing']} wajib diisi.</div> : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Metode Pembayaran *</label>
            <select
              name="metodePembayaran"
              value={formData.metodePembayaran}
              onChange={handleChange}
              required
              className={
                errors['metodePembayaran']
                  ? 'mt-2 w-full rounded-3xl border border-red-500 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
              }
            >
              <option value={MetodePembayaran.TRANSFER}>Transfer</option>
              <option value={MetodePembayaran.CASH}>Cash</option>
              <option value={MetodePembayaran.TF_CASH}>TF + Cash</option>
              <option value={MetodePembayaran.PICKUP_ONLINE}>Pickup Online</option>
              <option value={MetodePembayaran.BULANAN}>Bulanan</option>
            </select>
            {errors['metodePembayaran'] ? (
              <div className="mt-1 text-xs text-red-600">{errors['metodePembayaran']} wajib diisi.</div>
            ) : null}
          </div>

          <div className="md:col-span-2 flex flex-col gap-3 items-end justify-end pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-3xl border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:w-auto"
            >
              Batal
            </button>
            {!showConfirm ? (
              <button
                type="button"
                onClick={handleSubmitClick}
                className="w-full rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 sm:w-auto flex items-center justify-center gap-2"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Menyimpan...'
                  : editingId
                  ? 'Perbarui Rekapan'
                  : 'Tambah Rekapan'}
              </button>
            ) : (
              <div className="w-full">
                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Tanggal</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formatDate(formData.tanggal)}
                        {changedFields?.tanggal ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Waybill</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formData.waybill || '-'}
                        {changedFields?.waybill ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Provinsi</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formData.provinsi || '-'}
                        {changedFields?.provinsi ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Jenis</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formData.jenisBarang || '-'}
                        {changedFields?.jenisBarang ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Koli</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formatNumber(formData.jumlahKoli)}
                        {changedFields?.jumlahKoli ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Berat (Kg)</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formData.beratKg}
                        {changedFields?.beratKg ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Ongkir</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formatCurrency(formData.ongkir)}
                        {changedFields?.ongkir ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Asuransi</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formatCurrency(formData.asuransi)}
                        {changedFields?.asuransi ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Packing</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formatCurrency(formData.packing)}
                        {changedFields?.packing ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-600">Metode Pembayaran</div>
                      <div className="flex items-center gap-2 text-slate-900">
                        {formData.metodePembayaran}
                        {changedFields?.metodePembayaran ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => submitExec()}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-3xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60 flex items-center gap-2"
                  >
                    <span className="text-sm">✓</span>
                    {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Konfirmasi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
