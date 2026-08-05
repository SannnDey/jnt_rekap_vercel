'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useKasbonSummary, useKasbonList, useCreateKasbon, useUpdateKasbon, useDeleteKasbon } from '@/hooks/useKasbon';
import { apiClient } from '@/lib/api';
import { formatCurrency, getFriendlyErrorMessage, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import { useQueryClient } from '@tanstack/react-query';

export default function RekapanKasbonPage() {
  const [exportLoading, setExportLoading] = useState(false);
  const { toast } = useToast();
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  // export preview modal state (match Rekapan Outgoing UX)
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState<any[]>([]);
  const [exportSelectedMonth, setExportSelectedMonth] = useState('');
  const [exportPeriodLabel, setExportPeriodLabel] = useState('');
  const [exportPreviewLoading, setExportPreviewLoading] = useState(false);
  const { data: summaryResp, isLoading } = useKasbonSummary(startDateFilter || undefined, endDateFilter || undefined);
  const qc = useQueryClient();
  const listQuery = useKasbonList(1, 10000, undefined, startDateFilter || undefined, endDateFilter || undefined);
  const kasbonItems = listQuery.data?.data || [];

  const createMutation = useCreateKasbon();
  const updateMutation = useUpdateKasbon();
  const deleteMutation = useDeleteKasbon();

  const [employee, setEmployee] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [settled, setSettled] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalKasbon, setOriginalKasbon] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [employeeHistory, setEmployeeHistory] = useState<string[]>([]);
  const summary = summaryResp?.data;

  const headerRight = (
    <div className="flex items-center gap-3">
      <Link href="/" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Beranda</Link>
    </div>
  );

  // helper: compute month label / month range (used by preview)
  const computeExportMonthLabel = (month: string) => {
    if (!month) return 'Semua waktu';
    const [year, monthValue] = month.split('-');
    const parsed = new Date(Number(year), Number(monthValue) - 1, 1);
    return parsed.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
  };

  const getMonthRange = (month: string) => {
    if (!month) return null;
    const [year, monthValue] = month.split('-');
    const yearNum = Number(year);
    const monthNum = Number(monthValue);
    if (!yearNum || !monthNum) return null;
    const startDate = `${year}-${monthValue}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${year}-${monthValue}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  };

  // create and download workbook from given rows (used by modal Download)
  const downloadWorkbook = async (items: any[], periodLabel: string) => {
    setExportLoading(true);
    try {
      const ExcelJS = (await import('exceljs')) as any;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Kasbon');

      worksheet.columns = [
        { header: 'Employee', key: 'employee', width: 30 },
        { header: 'Tanggal', key: 'tanggal', width: 18 },
        { header: 'Amount', key: 'amount', width: 16 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Settled', key: 'settled', width: 12 },
      ];

      const titleRow = worksheet.addRow(['REKAPAN KASBON']);
      titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells('A1:E1');
      titleRow.height = 26;

      const periodRow = worksheet.addRow([`Periode Rekap: ${periodLabel}`]);
      periodRow.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
      worksheet.mergeCells('A2:E2');
      periodRow.alignment = { horizontal: 'left', vertical: 'middle' };
      periodRow.height = 18;

      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['Employee', 'Tanggal', 'Amount', 'Description', 'Settled']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6E4F' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 22;

      let totalCount = 0;
      let totalAmount = 0;

      items.forEach((it: any, idx: number) => {
        const tanggalValue = it.tanggal ? new Date(it.tanggal) : it.tanggal;
        const row = worksheet.addRow([it.employee, tanggalValue instanceof Date && !isNaN(tanggalValue.getTime()) ? tanggalValue : it.tanggal, it.amount, it.description || '', it.settled ? 'Yes' : 'No']);
        row.font = { size: 10 };
        row.alignment = { horizontal: 'left', vertical: 'middle' };

        if (idx % 2 === 0) {
          row.eachCell((cell: any) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FBF7' } };
          });
        }

        row.getCell(3).alignment = { horizontal: 'right' };
        (row.getCell(3) as any).numFmt = '#,##0';

        totalCount += 1;
        totalAmount += Number(it.amount || 0);
      });

      worksheet.addRow([]);
      const totalHeaderRow = worksheet.addRow([]);
      totalHeaderRow.getCell(1).value = 'TOTAL';
      totalHeaderRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      totalHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6E4F' } };
      totalHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const totalRow = worksheet.addRow(['', `Total Transaksi: ${totalCount}`, '', '', totalAmount]);
      totalRow.font = { bold: true, size: 11 };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } };
      totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
      totalRow.getCell(5).alignment = { horizontal: 'right' };
      (totalRow.getCell(5) as any).numFmt = '#,##0';

      worksheet.addRow([]);
      const summaryHeader = worksheet.addRow(['RINGKASAN']);
      summaryHeader.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      summaryHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B6E4F' } };
      summaryHeader.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(`A${summaryHeader.number}:C${summaryHeader.number}`);

      const summaryMap = items.reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
        const employee = row.employee || 'Unknown';
        if (!acc[employee]) acc[employee] = { count: 0, total: 0 };
        acc[employee].count += 1;
        acc[employee].total += Number(row.amount || 0);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const summaryData = Object.entries(summaryMap).map(([label, values]) => ({
        label,
        count: values.count,
        total: values.total,
      }));

      summaryData.forEach((s) => {
        const r = worksheet.addRow([s.label, s.count, s.total]);
        r.getCell(1).font = { bold: true };
        r.getCell(2).font = { bold: true };
        r.getCell(3).font = { bold: true };
        r.getCell(3).alignment = { horizontal: 'right' };
        (r.getCell(3) as any).numFmt = '#,##0';
      });

      worksheet.views = [{ state: 'frozen', ySplit: 4 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeLabel = periodLabel.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'kasbon_export';
      link.href = url;
      link.download = `kasbon_${safeLabel}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast('Export Kasbon berhasil disiapkan', 'success');
    } catch (err) {
      toast(getFriendlyErrorMessage(err), 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const resetForm = () => {
    setEmployee('');
    setTanggal('');
    setAmount('');
    setDescription('');
    setSettled(false);
    setEditingId(null);
    setOriginalKasbon(null);
    setShowConfirm(false);
    setErrors({});
  };

  const validateKasbonForm = () => {
    const newErrors: Record<string, string> = {};
    if (!employee.trim()) newErrors.employee = 'Employee wajib diisi.';
    if (!tanggal) newErrors.tanggal = 'Tanggal wajib diisi.';
    if (amount === '' || Number(amount) <= 0) newErrors.amount = 'Amount wajib diisi dan lebih besar dari nol.';
    return newErrors;
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateKasbonForm();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setShowConfirm(true);
  };

  const submitKasbon = async () => {
    try {
      const payload = { employee: employee.trim(), tanggal, amount: Number(amount), description: description.trim(), settled };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast('Kasbon diperbarui', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        toast('Kasbon dibuat', 'success');
      }

      try {
        const key = 'kasbon_employee_history';
        const cur = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        const normalized = String(employee).trim();
        if (normalized) {
          const merged = [normalized, ...cur.filter((c) => c !== normalized)].slice(0, 30);
          localStorage.setItem(key, JSON.stringify(merged));
          setEmployeeHistory(merged);
        }
      } catch (e) {
        // ignore
      }
      resetForm();
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['kasbon-list'] as const });
      qc.invalidateQueries({ queryKey: ['kasbon-summary'] as const });
    } catch (err) {
      toast(getFriendlyErrorMessage(err), 'error');
      setShowConfirm(false);
    }
  };

  useEffect(() => {
    try {
      const key = 'kasbon_employee_history';
      const fromStorage = JSON.parse(localStorage.getItem(key) || '[]') as string[];
      // also merge with server-derived employees
      const fromServer = Array.from(new Set(kasbonItems.map((i: any) => i.employee).filter(Boolean)));
      const merged = [...fromStorage, ...fromServer.filter((s) => !fromStorage.includes(s))].slice(0, 30);
      setEmployeeHistory(merged);
    } catch (e) {
      const fromServer = Array.from(new Set(kasbonItems.map((i: any) => i.employee).filter(Boolean)));
      setEmployeeHistory(fromServer.slice(0, 30));
    }
  }, [kasbonItems]);

  const handleEdit = (item: any) => {
    if (exportPreviewOpen) {
      setExportPreviewOpen(false);
      setExportPreviewRows([]);
      setExportSelectedMonth('');
      setExportPeriodLabel('');
    }
    setShowConfirm(false);

    const formattedTanggal = item.tanggal ? item.tanggal.slice(0, 10) : '';
    const formattedAmount = item.amount == null ? '' : Number(item.amount);
    const original = {
      employee: item.employee || '',
      tanggal: formattedTanggal,
      amount: formattedAmount,
      description: item.description || '',
      settled: Boolean(item.settled),
    };
    setEditingId(item.id);
    setOriginalKasbon(original);
    setEmployee(item.employee || '');
    setTanggal(formattedTanggal);
    setAmount(formattedAmount);
    setDescription(item.description || '');
    setSettled(Boolean(item.settled));
    setShowForm(true);
  };

  const changedFields = originalKasbon
    ? {
        employee: employee !== originalKasbon.employee,
        tanggal: tanggal !== originalKasbon.tanggal,
        amount: amount !== originalKasbon.amount,
        description: description !== originalKasbon.description,
        settled: settled !== originalKasbon.settled,
      }
    : null;

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kasbon ini?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast('Kasbon dihapus', 'success');
      qc.invalidateQueries({ queryKey: ['kasbon-list'] as const });
      qc.invalidateQueries({ queryKey: ['kasbon-summary'] as const });
    } catch (err) {
      toast(getFriendlyErrorMessage(err), 'error');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Header title="Rekapan Kasbon" subtitle="Kasbon" description="Ringkasan kasbon per karyawan." right={headerRight} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Rekapan Kasbon Per Karyawan</h1>
              <p className="mt-1 text-sm text-slate-500">Menampilkan total kasbon per karyawan dalam periode.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Dari</label>
                  <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="rounded-md border px-3 py-1" />
                <label className="text-sm text-slate-600">Sampai</label>
                <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="rounded-md border px-3 py-1" />
                <button onClick={() => { qc.invalidateQueries({ queryKey: ['kasbon-list'] as const }); qc.invalidateQueries({ queryKey: ['kasbon-summary'] as const }); }} className="rounded-full border px-3 py-1 text-sm">Terapkan</button>
                <button onClick={() => { setStartDateFilter(''); setEndDateFilter(''); qc.invalidateQueries({ queryKey: ['kasbon-list'] as const }); qc.invalidateQueries({ queryKey: ['kasbon-summary'] as const }); }} className="rounded-full border px-3 py-1 text-sm">Reset</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="rounded-full bg-slate-900 px-4 py-2 text-white font-semibold transition hover:bg-slate-800">
                  + Tambah Kasbon
                </button>
                <button type="button" onClick={() => { setExportPreviewRows([]); setExportSelectedMonth(''); setExportPeriodLabel(''); setExportPreviewOpen(true); }} className="rounded-full bg-sky-600 px-4 py-2 text-white font-semibold transition hover:bg-sky-700">
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="text-sm text-slate-500">Memuat ringkasan...</div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-slate-600">Kelola kasbon dengan form terpisah dan konfirmasi sebelum menyimpan.</p>
                </div>

                {showForm && (
                  <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 px-4 py-10 backdrop-blur-sm">
                    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200 max-h-[calc(100vh-6rem)]">
                      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-sky-600">Form Kasbon</p>
                          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{editingId ? 'Edit Kasbon' : 'Tambah Kasbon'}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            resetForm();
                            setShowForm(false);
                          }}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Tutup
                        </button>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 14rem)' }}>
                          <form onSubmit={handleFormSubmit} className="grid gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700">Employee *</label>
                              <input
                                type="text"
                                value={employee}
                                onChange={(e) => setEmployee(e.target.value)}
                                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.employee ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`}
                                placeholder="Nama karyawan"
                              />
                              {errors.employee ? <div className="mt-1 text-xs text-red-600">{errors.employee}</div> : null}
                              {employeeHistory.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {employeeHistory.slice(0, 8).map((h) => (
                                    <button
                                      key={h}
                                      type="button"
                                      onClick={() => setEmployee(h)}
                                      className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-200"
                                    >
                                      {h}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700">Tanggal *</label>
                                <input
                                  type="date"
                                  value={tanggal}
                                  onChange={(e) => setTanggal(e.target.value)}
                                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.tanggal ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`}
                                />
                                {errors.tanggal ? <div className="mt-1 text-xs text-red-600">{errors.tanggal}</div> : null}
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-slate-700">Amount *</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={amount === '' ? '' : formatNumber(amount)}
                                  onChange={(e) => {
                                    const parsed = parseFormattedNumber(e.target.value);
                                    setAmount(parsed === '' ? '' : Number(parsed));
                                  }}
                                  placeholder="0"
                                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${errors.amount ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-slate-50' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-slate-50'}`}
                                />
                                {errors.amount ? <div className="mt-1 text-xs text-red-600">{errors.amount}</div> : null}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700">Description</label>
                              <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                placeholder="Keterangan tambahan"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                id="settled"
                                type="checkbox"
                                checked={settled}
                                onChange={(e) => setSettled(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                              />
                              <label htmlFor="settled" className="text-sm font-medium text-slate-700">Settled</label>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => {
                                  resetForm();
                                  setShowForm(false);
                                }}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                              >
                                {editingId ? 'Simpan' : 'Tambah'}
                              </button>
                            </div>
                          </form>

                          {showConfirm && (
                            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-900">Konfirmasi</h4>
                                  <p className="mt-1 text-sm text-slate-500">Periksa kembali data sebelum menyimpan.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowConfirm(false)}
                                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Ubah
                                </button>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl bg-white p-4 shadow-sm">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Employee</p>
                                  <div className="mt-2 flex items-center gap-2 text-slate-900">
                                    {employee || '-'}
                                    {changedFields?.employee ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                                  </div>
                                </div>
                                <div className="rounded-3xl bg-white p-4 shadow-sm">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tanggal</p>
                                  <div className="mt-2 flex items-center gap-2 text-slate-900">
                                    {tanggal || '-'}
                                    {changedFields?.tanggal ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                                  </div>
                                </div>
                                <div className="rounded-3xl bg-white p-4 shadow-sm">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Amount</p>
                                  <div className="mt-2 flex items-center gap-2 text-slate-900">
                                    {amount === '' ? '-' : formatCurrency(Number(amount))}
                                    {changedFields?.amount ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                                  </div>
                                </div>
                                <div className="rounded-3xl bg-white p-4 shadow-sm">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Description</p>
                                  <div className="mt-2 flex items-center gap-2 text-slate-900">
                                    {description || '-'}
                                    {changedFields?.description ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                                  </div>
                                </div>
                                <div className="rounded-3xl bg-white p-4 shadow-sm sm:col-span-2">
                                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Settled</p>
                                  <div className="mt-2 flex items-center gap-2 text-slate-900">
                                    {settled ? 'Yes' : 'No'}
                                    {changedFields?.settled ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">Diedit</span> : null}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => setShowConfirm(false)}
                                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={submitKasbon}
                                  disabled={createMutation.isPending || updateMutation.isPending}
                                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                                >
                                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Konfirmasi'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {exportPreviewOpen && (
                  <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
                    <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">Export Rekapan</h3>
                            <p className="mt-1 text-sm text-slate-500">Pilih bulan yang ingin diekspor, lalu tampilkan preview sebelum mengunduh.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setExportPreviewOpen(false);
                              setExportPreviewRows([]);
                              setExportSelectedMonth('');
                              setExportPeriodLabel('');
                            }}
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <p className="text-sm font-semibold text-slate-700">Pilih Bulan Ekspor</p>
                            <p className="mt-2 text-sm text-slate-500">Gunakan bulan yang ingin ditarik dari data rekapan.</p>
                            <input
                              type="month"
                              value={exportSelectedMonth}
                              onChange={(e) => setExportSelectedMonth(e.target.value)}
                              className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <p className="mt-3 text-sm text-slate-600">
                              Bulan terpilih: <span className="font-semibold text-slate-900">{exportPeriodLabel || (exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'Belum dipilih')}</span>
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!exportSelectedMonth) {
                                  toast('Pilih bulan export terlebih dahulu.', 'error');
                                  return;
                                }
                                const range = getMonthRange(exportSelectedMonth);
                                if (!range) {
                                  toast('Periode bulan tidak valid.', 'error');
                                  return;
                                }

                                setExportPreviewLoading(true);
                                try {
                                  const resp = await apiClient.getKasbonList(
                                    1,
                                    10000,
                                    undefined,
                                    range.startDate,
                                    range.endDate,
                                    true
                                  );
                                  const items = resp.data || [];
                                  if (items.length === 0) {
                                    toast('Tidak ada data untuk bulan tersebut.', 'error');
                                    setExportPreviewRows([]);
                                    setExportPeriodLabel('');
                                    return;
                                  }
                                  setExportPreviewRows(items);
                                  setExportPeriodLabel(computeExportMonthLabel(exportSelectedMonth));
                                } catch (err) {
                                  toast(getFriendlyErrorMessage(err), 'error');
                                } finally {
                                  setExportPreviewLoading(false);
                                }
                              }}
                              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                            >
                              {exportPreviewLoading ? 'Memuat preview...' : 'Tampilkan Preview'}
                            </button>
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
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Amount</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Settled</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                {exportPreviewRows.slice(0, 8).map((row, index) => (
                                  <tr key={row.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{index + 1}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.employee}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.amount)}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.description || '-'}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.settled ? 'Yes' : 'No'}</td>
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
                        <button
                          type="button"
                          onClick={() => {
                            setExportPreviewOpen(false);
                            setExportPreviewRows([]);
                            setExportSelectedMonth('');
                            setExportPeriodLabel('');
                          }}
                          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (exportPreviewRows.length === 0) {
                              toast('Tampilkan preview terlebih dahulu sebelum download.');
                              return;
                            }
                            await downloadWorkbook(exportPreviewRows, exportPeriodLabel || (exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'Semua waktu'));
                            setExportPreviewOpen(false);
                            setExportPreviewRows([]);
                            setExportSelectedMonth('');
                            setExportPeriodLabel('');
                          }}
                          disabled={exportLoading}
                          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                        >
                          {exportLoading ? 'Menyiapkan...' : 'Download Excel'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  {(summary?.byEmployee || []).map((b) => (
                    <div key={b.employee} className="rounded-2xl border p-4 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">{b.employee}</p>
                          <p className="mt-2 font-semibold text-slate-900">{formatCurrency(b.totalAmount)}</p>
                        </div>
                        <div className="text-sm text-slate-600">{b.count} transaksi</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Daftar Kasbon</h3>
                  <div className="space-y-3">
                    {(() => {
                      const sorted = [...kasbonItems].sort((a: any, b: any) => (String(a.employee || '').localeCompare(String(b.employee || ''))));
                      return sorted.map((it: any) => (
                        <div key={it.id} className="flex items-center justify-between rounded-md border p-3 bg-white">
                        <div>
                          <div className="font-semibold">{it.employee} · {new Date(it.tanggal).toLocaleDateString('id-ID')}</div>
                          <div className="text-sm text-slate-600">{it.description || '-'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold">{formatCurrency(it.amount)}</div>
                          <button type="button" onClick={() => handleEdit(it)} className="text-sm text-sky-600">Edit</button>
                          <button type="button" onClick={() => handleDelete(it.id)} className="text-sm text-rose-600">Hapus</button>
                        </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
