'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { usePengeluaranList, usePengeluaranSummary, useCreatePengeluaran, useUpdatePengeluaran, useDeletePengeluaran } from '@/hooks/usePengeluaran';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency, getFriendlyErrorMessage, computeExportMonthLabel, getMonthRange } from '@/lib/utils';

export default function RekapanPengeluaranPage() {
  const { toast } = useToast();
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  // export preview modal state
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState<any[]>([]);
  const [exportSelectedMonth, setExportSelectedMonth] = useState('');
  const [exportPeriodLabel, setExportPeriodLabel] = useState('');
  const [exportPreviewLoading, setExportPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const summaryQuery = usePengeluaranSummary(kategoriFilter || undefined, startDateFilter || undefined, endDateFilter || undefined);
  const listQuery = usePengeluaranList(1, 10000, kategoriFilter || undefined, startDateFilter || undefined, endDateFilter || undefined);
  const items = listQuery.data?.data || [];

  const createMutation = useCreatePengeluaran();
  const updateMutation = useUpdatePengeluaran();
  const deleteMutation = useDeletePengeluaran();

  const [tanggal, setTanggal] = useState('');
  const [jenis, setJenis] = useState('');
  const [nominal, setNominal] = useState<number | ''>('');
  const [metode, setMetode] = useState('CASH');
  const [kategori, setKategori] = useState('Pengeluaran Harian');
  const [tipeKendaraan, setTipeKendaraan] = useState('');
  const [jenisBahanBakar, setJenisBahanBakar] = useState('');
  const [liter, setLiter] = useState<number | ''>('');
  const [km, setKm] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [originalPengeluaran, setOriginalPengeluaran] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [harianPage, setHarianPage] = useState(1);
  const [outgoingPage, setOutgoingPage] = useState(1);
  const [bbmPage, setBbmPage] = useState(1);
  const PAGE_SIZE = 10;

  const resetForm = () => {
    setTanggal('');
    setJenis('');
    setNominal('');
    setMetode('CASH');
    setKategori('Pengeluaran Harian');
    setTipeKendaraan('');
    setJenisBahanBakar('');
    setLiter('');
    setKm('');
    setEditingId(null);
    setShowConfirm(false);
    setOriginalPengeluaran(null);
    setErrors({});
  };

  const validatePengeluaranForm = () => {
    const newErrors: Record<string, string> = {};
    if (!tanggal) newErrors.tanggal = 'Tanggal wajib diisi.';
    if (nominal === '' || Number(nominal) <= 0) newErrors.nominal = 'Nominal wajib diisi dan lebih besar dari nol.';
    const isBBM = kategori === 'Pengeluaran BBM';
    if (isBBM) {
      if (!tipeKendaraan.trim()) newErrors.tipeKendaraan = 'Tipe kendaraan wajib diisi.';
      if (!jenisBahanBakar) newErrors.jenisBahanBakar = 'Jenis bahan bakar wajib dipilih.';
      if (liter === '' || Number(liter) <= 0) newErrors.liter = 'Liter wajib diisi dan lebih besar dari nol.';
      if (km === '' || Number(km) <= 0) newErrors.km = 'KM wajib diisi dan lebih besar dari nol.';
    } else {
      if (!jenis.trim()) newErrors.jenis = 'Jenis pengeluaran wajib diisi.';
    }
    return newErrors;
  };

  const handleFormSubmit = (e: any) => {
    e?.preventDefault?.();
    const validation = validatePengeluaranForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setShowConfirm(true);
  };

  const submitPengeluaran = async () => {
    try {
      const isBBM = kategori === 'Pengeluaran BBM';
      const payload: any = {
        tanggal,
        jenis: isBBM ? jenisBahanBakar : jenis,
        nominal: Number(nominal),
        metodePembayaran: metode,
        kategori,
      };
      if (isBBM) {
        payload.tipeKendaraan = tipeKendaraan;
        payload.jenisBahanBakar = jenisBahanBakar;
        payload.liter = Number(liter);
        payload.km = Number(km);
      }

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast('Pengeluaran diperbarui', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        toast('Pengeluaran dibuat', 'success');
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      toast(getFriendlyErrorMessage(err), 'error');
      setShowConfirm(false);
    }
  };

  const handleEdit = (it: any) => {
    setEditingId(it.id);
    setOriginalPengeluaran({
      tanggal: it.tanggal ? it.tanggal.slice(0, 10) : '',
      kategori: it.kategori || 'Pengeluaran Harian',
      jenis: it.jenis || '',
      tipeKendaraan: it.tipeKendaraan || '',
      jenisBahanBakar: it.jenisBahanBakar || (it.kategori === 'Pengeluaran BBM' ? it.jenis : ''),
      nominal: it.nominal || '',
      metodePembayaran: it.metodePembayaran || 'CASH',
      liter: it.liter ?? '',
      km: it.km ?? '',
    });
    setTanggal(it.tanggal ? it.tanggal.slice(0, 10) : '');
    setKategori(it.kategori || 'Pengeluaran Harian');
    setMetode(it.metodePembayaran || 'CASH');
    setNominal(it.nominal || '');
    setTipeKendaraan(it.tipeKendaraan || '');
    setJenisBahanBakar(it.jenisBahanBakar || (it.kategori === 'Pengeluaran BBM' ? it.jenis : ''));
    setKm(it.km ?? '');
    setLiter(it.liter ?? '');
    setJenis(it.kategori === 'Pengeluaran BBM' ? '' : it.jenis || '');
    setShowForm(true);
    setShowConfirm(false);
  };

  const changedFields = originalPengeluaran
    ? {
        tanggal: tanggal !== originalPengeluaran.tanggal,
        kategori: kategori !== originalPengeluaran.kategori,
        jenis: jenis !== originalPengeluaran.jenis,
        tipeKendaraan: tipeKendaraan !== originalPengeluaran.tipeKendaraan,
        jenisBahanBakar: jenisBahanBakar !== originalPengeluaran.jenisBahanBakar,
        nominal: Number(nominal) !== Number(originalPengeluaran.nominal),
        metode: metode !== originalPengeluaran.metodePembayaran,
        liter: Number(liter) !== Number(originalPengeluaran.liter),
        km: Number(km) !== Number(originalPengeluaran.km),
      }
    : null;

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast('Pengeluaran dihapus', 'success');
    } catch (err) {
      toast(getFriendlyErrorMessage(err), 'error');
    }
  };

  const harianItems = items.filter((it: any) => it.kategori === 'Pengeluaran Harian');
  const outgoingItems = items.filter((it: any) => it.kategori === 'Pengeluaran Outgoing');
  const bbmItems = items.filter((it: any) => it.kategori === 'Pengeluaran BBM');

  const harianTotalPages = Math.max(1, Math.ceil(harianItems.length / PAGE_SIZE));
  const outgoingTotalPages = Math.max(1, Math.ceil(outgoingItems.length / PAGE_SIZE));
  const bbmTotalPages = Math.max(1, Math.ceil(bbmItems.length / PAGE_SIZE));

  const harianPageSafe = Math.min(harianPage, harianTotalPages);
  const outgoingPageSafe = Math.min(outgoingPage, outgoingTotalPages);
  const bbmPageSafe = Math.min(bbmPage, bbmTotalPages);

  const harianPageItems = harianItems.slice((harianPageSafe - 1) * PAGE_SIZE, harianPageSafe * PAGE_SIZE);
  const outgoingPageItems = outgoingItems.slice((outgoingPageSafe - 1) * PAGE_SIZE, outgoingPageSafe * PAGE_SIZE);
  const bbmPageItems = bbmItems.slice((bbmPageSafe - 1) * PAGE_SIZE, bbmPageSafe * PAGE_SIZE);

  const headerRight = (
    <div className="flex items-center gap-3">
      <Link href="/" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Beranda</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <Header title="Rekapan Pengeluaran" subtitle="Pengeluaran" description="Rekap pengeluaran harian & outgoing" right={headerRight} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Rekapan Pengeluaran</h1>
              <p className="mt-1 text-sm text-slate-500">Tambah dan lihat pengeluaran Harian & Outgoing.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-600">Gunakan form terpisah untuk tambah atau edit pengeluaran.</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="rounded-full bg-slate-900 px-4 py-2 text-white font-semibold transition hover:bg-slate-800">+ Tambah Pengeluaran</button>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 px-4 py-10 backdrop-blur-sm">
              <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200 max-h-[calc(100vh-6rem)]">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-600">Form Pengeluaran</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">{editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h3>
                  </div>
                  <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tutup</button>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 14rem)' }}>
                    <form onSubmit={handleFormSubmit} className="grid gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Tanggal *</label>
                        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.tanggal ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`} />
                        {errors.tanggal ? <div className="mt-1 text-xs text-red-600">{errors.tanggal}</div> : null}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Kategori *</label>
                        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-sky-100">
                          <option>Pengeluaran Harian</option>
                          <option>Pengeluaran Outgoing</option>
                          <option>Pengeluaran BBM</option>
                        </select>
                      </div>

                      {kategori === 'Pengeluaran BBM' ? (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700">Tipe Kendaraan *</label>
                            <input value={tipeKendaraan} onChange={(e) => setTipeKendaraan(e.target.value)} placeholder="Tipe Kendaraan" className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.tipeKendaraan ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`} />
                            {errors.tipeKendaraan ? <div className="mt-1 text-xs text-red-600">{errors.tipeKendaraan}</div> : null}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700">Jenis Bahan Bakar *</label>
                            <select value={jenisBahanBakar} onChange={(e) => setJenisBahanBakar(e.target.value)} className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.jenisBahanBakar ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`}>
                              <option value="">Pilih Jenis Bahan Bakar</option>
                              <option value="Pertamax">Pertamax</option>
                              <option value="Pertalite">Pertalite</option>
                              <option value="Solar">Solar</option>
                              <option value="Dexlite">Dexlite</option>
                              <option value="Premium">Premium</option>
                              <option value="Pertamina Dex">Pertamina Dex</option>
                            </select>
                            {errors.jenisBahanBakar ? <div className="mt-1 text-xs text-red-600">{errors.jenisBahanBakar}</div> : null}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700">Jumlah (Rp) *</label>
                              <input value={nominal} onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Nominal" type="number" className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.nominal ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`} />
                              {errors.nominal ? <div className="mt-1 text-xs text-red-600">{errors.nominal}</div> : null}
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700">Liter *</label>
                              <input value={liter} onChange={(e) => setLiter(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Liter" type="number" step="0.01" className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.liter ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`} />
                              {errors.liter ? <div className="mt-1 text-xs text-red-600">{errors.liter}</div> : null}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700">KM *</label>
                            <input value={km} onChange={(e) => setKm(e.target.value === '' ? '' : Number(e.target.value))} placeholder="KM" type="number" className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.km ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`} />
                            {errors.km ? <div className="mt-1 text-xs text-red-600">{errors.km}</div> : null}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700">Jenis Pengeluaran *</label>
                            <input value={jenis} onChange={(e) => setJenis(e.target.value)} placeholder="Jenis Pengeluaran" className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.jenis ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`} />
                            {errors.jenis ? <div className="mt-1 text-xs text-red-600">{errors.jenis}</div> : null}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700">Nominal *</label>
                            <input value={nominal} onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Nominal" type="number" className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.nominal ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`} />
                            {errors.nominal ? <div className="mt-1 text-xs text-red-600">{errors.nominal}</div> : null}
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-slate-700">Metode Pembayaran *</label>
                        <select value={metode} onChange={(e) => setMetode(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-sky-100">
                          <option value="CASH">Cash</option>
                          <option value="TRANSFER">Transfer</option>
                        </select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
                        <button type="submit" className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">{editingId ? 'Simpan' : 'Lanjutkan'}</button>
                      </div>
                    </form>

                    {showConfirm && (
                      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">Konfirmasi Pengeluaran</h4>
                            <p className="mt-1 text-sm text-slate-500">Periksa kembali data sebelum menyimpan.</p>
                          </div>
                          <button type="button" onClick={() => setShowConfirm(false)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Ubah</button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-3xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tanggal</p>
                            <p className="mt-2 text-slate-900">{tanggal || '-'}</p>
                            {changedFields?.tanggal ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                          </div>
                          <div className="rounded-3xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kategori</p>
                            <p className="mt-2 text-slate-900">{kategori}</p>
                            {changedFields?.kategori ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                          </div>
                          {kategori === 'Pengeluaran BBM' ? (
                            <>
                              <div className="rounded-3xl bg-white p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tipe Kendaraan</p>
                                <p className="mt-2 text-slate-900">{tipeKendaraan || '-'}</p>
                                {changedFields?.tipeKendaraan ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                              </div>
                              <div className="rounded-3xl bg-white p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Jenis Bahan Bakar</p>
                                <p className="mt-2 text-slate-900">{jenisBahanBakar || '-'}</p>
                                {changedFields?.jenisBahanBakar ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                              </div>
                              <div className="rounded-3xl bg-white p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Liter</p>
                                <p className="mt-2 text-slate-900">{liter === '' ? '-' : liter}</p>
                                {changedFields?.liter ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                              </div>
                              <div className="rounded-3xl bg-white p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">KM</p>
                                <p className="mt-2 text-slate-900">{km === '' ? '-' : km}</p>
                                {changedFields?.km ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                              </div>
                            </>
                          ) : (
                            <div className="rounded-3xl bg-white p-4 shadow-sm sm:col-span-2">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Jenis Pengeluaran</p>
                              <p className="mt-2 text-slate-900">{jenis || '-'}</p>
                              {changedFields?.jenis ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                            </div>
                          )}
                          <div className="rounded-3xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Nominal</p>
                            <p className="mt-2 text-slate-900">{nominal === '' ? '-' : formatCurrency(Number(nominal))}</p>
                            {changedFields?.nominal ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                          </div>
                          <div className="rounded-3xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Metode Pembayaran</p>
                            <p className="mt-2 text-slate-900">{metode}</p>
                            {changedFields?.metode ? <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button type="button" onClick={() => setShowConfirm(false)} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Ubah</button>
                          <button type="button" onClick={submitPengeluaran} className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">{editingId ? 'Simpan' : 'Tambah'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Dari</label>
              <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="rounded-md border px-3 py-1" />
              <label className="text-sm text-slate-600">Sampai</label>
              <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="rounded-md border px-3 py-1" />
              <label className="text-sm text-slate-600">Kategori</label>
              <select value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)} className="rounded-md border px-3 py-1">
                <option value="">Semua</option>
                <option value="Pengeluaran Harian">Pengeluaran Harian</option>
                <option value="Pengeluaran Outgoing">Pengeluaran Outgoing</option>
                <option value="Pengeluaran BBM">Pengeluaran BBM</option>
              </select>
              <button onClick={() => { /* invalidate queries */ }} className="rounded-full border px-3 py-1 text-sm">Terapkan</button>
            </div>

            <div className="mt-6 grid gap-3">
              {summaryQuery.data?.data && (
                <div className="rounded-2xl border p-4 bg-slate-50">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Nominal</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatCurrency(summaryQuery.data.data.totalNominal || 0)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-slate-500">Pengeluaran Harian</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrency((summaryQuery.data.data.byKategori?.find((b: any) => b.kategori === 'Pengeluaran Harian')?.total) || 0)}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-slate-500">Pengeluaran Outgoing</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrency((summaryQuery.data.data.byKategori?.find((b: any) => b.kategori === 'Pengeluaran Outgoing')?.total) || 0)}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs text-slate-500">Pengeluaran BBM</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrency((summaryQuery.data.data.byKategori?.find((b: any) => b.kategori === 'Pengeluaran BBM')?.total) || 0)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">{summaryQuery.data.data.totalCount} transaksi</div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <input type="month" value={exportSelectedMonth} onChange={(e) => setExportSelectedMonth(e.target.value)} className="rounded-md border px-3 py-1" />
                <button onClick={async () => {
                  // when clicked, open preview modal and fetch preview rows
                  setExportPreviewRows([]);
                  setExportPeriodLabel('');
                  setExportPreviewOpen(true);
                }} className="rounded-full bg-sky-600 px-4 py-2 text-white font-semibold">Export</button>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">Daftar Pengeluaran</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pengeluaran Harian</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{harianItems.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pengeluaran Outgoing</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{outgoingItems.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pengeluaran BBM</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{bbmItems.length}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Pengeluaran Harian</h3>
                      <p className="text-sm text-slate-500">Total {harianItems.length} transaksi.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Harian</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Jenis</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Metode</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700">Nominal</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {harianPageItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Tidak ada Pengeluaran Harian.</td>
                          </tr>
                        ) : (
                          harianPageItems.map((it: any) => (
                            <tr key={it.id} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{new Date(it.tanggal).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-slate-700">{it.jenis}</td>
                              <td className="px-4 py-3 text-slate-700">{it.metodePembayaran}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(it.nominal)}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => handleEdit(it)} className="mr-3 text-sm text-sky-600">Edit</button>
                                <button onClick={() => handleDelete(it.id)} className="text-sm text-rose-600">Hapus</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {harianTotalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <div>Slide {harianPageSafe} dari {harianTotalPages}</div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setHarianPage(harianPageSafe - 1)} disabled={harianPageSafe === 1} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
                          <button type="button" onClick={() => setHarianPage(harianPageSafe + 1)} disabled={harianPageSafe === harianTotalPages} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Selanjutnya</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Pengeluaran Outgoing</h3>
                      <p className="text-sm text-slate-500">Total {outgoingItems.length} transaksi.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Outgoing</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Jenis</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Metode</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700">Nominal</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {outgoingPageItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Tidak ada Pengeluaran Outgoing.</td>
                          </tr>
                        ) : (
                          outgoingPageItems.map((it: any) => (
                            <tr key={it.id} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{new Date(it.tanggal).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-slate-700">{it.jenis}</td>
                              <td className="px-4 py-3 text-slate-700">{it.metodePembayaran}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(it.nominal)}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => handleEdit(it)} className="mr-3 text-sm text-sky-600">Edit</button>
                                <button onClick={() => handleDelete(it.id)} className="text-sm text-rose-600">Hapus</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {outgoingTotalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <div>Slide {outgoingPageSafe} dari {outgoingTotalPages}</div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setOutgoingPage(outgoingPageSafe - 1)} disabled={outgoingPageSafe === 1} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
                          <button type="button" onClick={() => setOutgoingPage(outgoingPageSafe + 1)} disabled={outgoingPageSafe === outgoingTotalPages} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Selanjutnya</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Pengeluaran BBM</h3>
                      <p className="text-sm text-slate-500">Total {bbmItems.length} transaksi.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">BBM</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Tipe Kendaraan</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Bahan Bakar</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Liter</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">KM</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Metode</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700">Nominal</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {bbmPageItems.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-6 text-center text-slate-500">Tidak ada Pengeluaran BBM.</td>
                          </tr>
                        ) : (
                          bbmPageItems.map((it: any) => (
                            <tr key={it.id} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{new Date(it.tanggal).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-slate-700">{it.tipeKendaraan || '-'}</td>
                              <td className="px-4 py-3 text-slate-700">{it.jenisBahanBakar || it.jenis}</td>
                              <td className="px-4 py-3 text-slate-700">{it.liter ?? '-'}</td>
                              <td className="px-4 py-3 text-slate-700">{it.km ?? '-'}</td>
                              <td className="px-4 py-3 text-slate-700">{it.metodePembayaran}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(it.nominal)}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => handleEdit(it)} className="mr-3 text-sm text-sky-600">Edit</button>
                                <button onClick={() => handleDelete(it.id)} className="text-sm text-rose-600">Hapus</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {bbmTotalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <div>Slide {bbmPageSafe} dari {bbmTotalPages}</div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setBbmPage(bbmPageSafe - 1)} disabled={bbmPageSafe === 1} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
                          <button type="button" onClick={() => setBbmPage(bbmPageSafe + 1)} disabled={bbmPageSafe === bbmTotalPages} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Selanjutnya</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {exportPreviewOpen && (
        <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Export Pengeluaran</h3>
                  <p className="mt-1 text-sm text-slate-500">Pilih bulan (opsional) lalu tampilkan preview sebelum mengunduh.</p>
                </div>
                <button type="button" onClick={() => { setExportPreviewOpen(false); setExportPreviewRows([]); setExportSelectedMonth(''); setExportPeriodLabel(''); }} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Tutup</button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Pilih Bulan Ekspor (opsional)</p>
                  <p className="mt-2 text-sm text-slate-500">Kosongkan untuk menggunakan filter tanggal aktif atau seluruh data.</p>
                  <input type="month" value={exportSelectedMonth} onChange={(e) => setExportSelectedMonth(e.target.value)} className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm" />
                  <p className="mt-3 text-sm text-slate-600">Bulan terpilih: <span className="font-semibold text-slate-900">{exportPeriodLabel || (exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'Belum dipilih')}</span></p>
                  <button type="button" onClick={async () => {
                    // fetch preview rows for selected month or filters
                    let range = null;
                    if (exportSelectedMonth) {
                      range = getMonthRange(exportSelectedMonth);
                      if (!range) { toast('Periode bulan tidak valid', 'error'); return; }
                    }
                    setExportPreviewLoading(true);
                    try {
                      const resp = await apiClient.getPengeluaranList(1, 10000, kategoriFilter || undefined, range?.startDate || startDateFilter || undefined, range?.endDate || endDateFilter || undefined, true);
                      const rows = resp.data || [];
                      if (rows.length === 0) { toast('Tidak ada data untuk periode tersebut', 'error'); setExportPreviewRows([]); setExportPeriodLabel(''); }
                      else { setExportPreviewRows(rows); setExportPeriodLabel(range ? computeExportMonthLabel(exportSelectedMonth) : (startDateFilter || endDateFilter ? `${startDateFilter || 'Awal'} - ${endDateFilter || 'Sekarang'}` : 'Semua waktu')); }
                    } catch (err) { toast(getFriendlyErrorMessage(err), 'error'); }
                    finally { setExportPreviewLoading(false); }
                  }} className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white">{exportPreviewLoading ? 'Memuat preview...' : 'Tampilkan Preview'}</button>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Ringkasan</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Periode Ekspor</p>
                      <p className="mt-2 font-semibold text-slate-900">{exportPeriodLabel || (exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'Belum dipilih')}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Baris</p>
                      <p className="mt-2 font-semibold text-slate-900">{exportPreviewRows.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {exportPreviewRows.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">No</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Jenis</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Nominal</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Metode</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {exportPreviewRows.slice(0, 8).map((row, index) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{index + 1}</td>
                          <td className="px-4 py-3 text-slate-700">{row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                          <td className="px-4 py-3 text-slate-700">{row.jenis}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.nominal)}</td>
                          <td className="px-4 py-3 text-slate-700">{row.metodePembayaran}</td>
                          <td className="px-4 py-3 text-slate-700">{row.kategori}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exportPreviewRows.length > 8 && (
                    <div className="p-4 text-sm text-slate-500">Menampilkan 8 dari {exportPreviewRows.length} baris.</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setExportPreviewOpen(false); setExportPreviewRows([]); setExportSelectedMonth(''); setExportPeriodLabel(''); }} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Batal</button>
              <button type="button" onClick={async () => {
                if (exportPreviewRows.length === 0) { toast('Tampilkan preview terlebih dahulu sebelum download.'); return; }
                setExportLoading(true);
                try {
                  // build workbook
                  const ExcelJS = (await import('exceljs')) as any;
                  const workbook = new ExcelJS.Workbook();
                  const worksheet = workbook.addWorksheet('Pengeluaran');
                  worksheet.columns = [
                    { header: 'Tanggal', key: 'tanggal', width: 18 },
                    { header: 'Jenis', key: 'jenis', width: 30 },
                    { header: 'Nominal', key: 'nominal', width: 16 },
                    { header: 'Metode Pembayaran', key: 'metode', width: 18 },
                    { header: 'Kategori', key: 'kategori', width: 20 },
                  ];

                  const titleRow = worksheet.addRow(['REKAPAN PENGELUARAN']);
                  titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
                  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
                  worksheet.mergeCells('A1:E1');

                  const periodRow = worksheet.addRow([`Periode Rekap: ${exportPeriodLabel || (exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'Semua waktu')}`]);
                  worksheet.mergeCells('A2:E2');
                  worksheet.addRow([]);

                  const header = worksheet.addRow(['Tanggal','Jenis','Nominal','Metode Pembayaran','Kategori']);
                  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6E4F' } };

                  let totalNominal = 0;
                  exportPreviewRows.forEach((it: any, idx: number) => {
                    const tanggalValue = it.tanggal ? new Date(it.tanggal) : it.tanggal;
                    const row = worksheet.addRow([tanggalValue instanceof Date && !isNaN(tanggalValue.getTime()) ? tanggalValue : it.tanggal, it.jenis, it.nominal, it.metodePembayaran, it.kategori]);
                    row.getCell(3).alignment = { horizontal: 'right' };
                    (row.getCell(3) as any).numFmt = '#,##0';
                    totalNominal += Number(it.nominal || 0);
                  });

                  worksheet.addRow([]);
                  const totalRow = worksheet.addRow(['', '', totalNominal, '', '']);
                  totalRow.font = { bold: true };
                  totalRow.getCell(3).alignment = { horizontal: 'right' };
                  (totalRow.getCell(3) as any).numFmt = '#,##0';

                  // add summary by kategori and metode
                  worksheet.addRow([]);
                  const summaryHeader = worksheet.addRow(['RINGKASAN']);
                  worksheet.mergeCells(`A${summaryHeader.number}:C${summaryHeader.number}`);

                  const summaryMapKategori = exportPreviewRows.reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
                    const key = row.kategori || 'Unknown';
                    if (!acc[key]) acc[key] = { count: 0, total: 0 };
                    acc[key].count += 1;
                    acc[key].total += Number(row.nominal || 0);
                    return acc;
                  }, {} as Record<string, { count: number; total: number }>);

                  const summaryDataKategori = Object.entries(summaryMapKategori);
                  if (summaryDataKategori.length > 0) {
                    worksheet.addRow(['Kategori','Count','Total']);
                    summaryDataKategori.forEach(([kategoriLabel, values]) => {
                      const r = worksheet.addRow([kategoriLabel, values.count, values.total]);
                      r.getCell(3).alignment = { horizontal: 'right' };
                      (r.getCell(3) as any).numFmt = '#,##0';
                    });
                  }

                  const summaryMapMetode = exportPreviewRows.reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
                    const key = row.metodePembayaran || 'Unknown';
                    if (!acc[key]) acc[key] = { count: 0, total: 0 };
                    acc[key].count += 1;
                    acc[key].total += Number(row.nominal || 0);
                    return acc;
                  }, {} as Record<string, { count: number; total: number }>);

                  const summaryDataMetode = Object.entries(summaryMapMetode);
                  if (summaryDataMetode.length > 0) {
                    worksheet.addRow([]);
                    worksheet.addRow(['Metode','Count','Total']);
                    summaryDataMetode.forEach(([metodeLabel, values]) => {
                      const r = worksheet.addRow([metodeLabel, values.count, values.total]);
                      r.getCell(3).alignment = { horizontal: 'right' };
                      (r.getCell(3) as any).numFmt = '#,##0';
                    });
                  }

                  worksheet.views = [{ state: 'frozen', ySplit: 4 }];

                  const buffer = await workbook.xlsx.writeBuffer();
                  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  const safeLabel = (exportPeriodLabel || (exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'pengeluaran_export')).replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'');
                  link.href = url; link.download = `pengeluaran_${safeLabel}.xlsx`;
                  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
                  toast('Export Pengeluaran berhasil disiapkan', 'success');
                } catch (err) { toast(getFriendlyErrorMessage(err), 'error'); }
                finally { setExportLoading(false); setExportPreviewOpen(false); setExportPreviewRows([]); setExportSelectedMonth(''); setExportPeriodLabel(''); }
              }} className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60">{exportLoading ? 'Menyiapkan...' : 'Download Excel'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

