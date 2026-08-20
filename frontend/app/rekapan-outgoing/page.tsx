'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { apiClient } from '@/lib/api';
import { getFriendlyErrorMessage, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import RekapanTable from '@/components/RekapanTable';
import RekapanForm from '@/components/RekapanForm';
import SearchFilters from '@/components/SearchFilters';
import SummaryCards from '@/components/SummaryCards';
import { CreateRekapanInput, MetodePembayaran, isValidMetodePembayaran, RekapanOutgoing } from '@/types';

type ImportPreviewRow = CreateRekapanInput & {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  rawMetodePembayaran: string | null;
  rawValues?: {
    berat?: any;
    ongkir?: any;
    asuransi?: any;
    packing?: any;
  };
};

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [provinsi, setProvinsi] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState('');
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPreviewLoading, setExportPreviewLoading] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState<RekapanOutgoing[]>([]);
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportSelectedMonth, setExportSelectedMonth] = useState('');
  const [exportPeriodLabel, setExportPeriodLabel] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [showOnlyInvalidImportRows, setShowOnlyInvalidImportRows] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();

  const importValidRows = importPreviewRows.filter((row) => row.valid);
  const importInvalidRows = importPreviewRows.filter((row) => !row.valid);
  const importDisplayRows = showOnlyInvalidImportRows ? importInvalidRows : importPreviewRows;

  const resetPage = () => setCurrentPage(1);
  const handleSearchChange = (term: string) => {
    resetPage();
    setSearchTerm(term);
  };
  const handleStartDateChange = (date: string) => {
    resetPage();
    setStartDate(date);
  };
  const handleEndDateChange = (date: string) => {
    resetPage();
    setEndDate(date);
  };
  const handleProvinsiChange = (value: string) => {
    resetPage();
    setProvinsi(value);
  };
  const handleMetodePembayaranChange = (value: string) => {
    resetPage();
    setMetodePembayaran(value);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleRefreshData = () => {
    setCurrentPage(1);
    setRefreshKey((value) => value + 1);
  };

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = showForm ? 'hidden' : '';
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [showForm]);

  // open edit form if ?openId= present
  const searchParams = useSearchParams();
  useEffect(() => {
    const id = searchParams.get('openId');
    if (id) {
      setEditingId(id);
      setShowForm(true);
    }
  }, [searchParams]);

  const headerRight = (
    <div className="flex items-center gap-3">
      <Link href="/" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Beranda</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <Header title="Rekapan Outgoing" subtitle="Rekapan" description="Lihat dan kelola semua pengiriman outgoing yang tercatat." right={headerRight} />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_35%)]" />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm">
            <div className="grid gap-8 xl:grid-cols-[1.6fr_0.9fr] xl:items-center">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Dashboard</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Rekapan Outgoing Barang</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Kelola pengiriman dengan tampilan rapi, filter cepat, dan statistik real-time untuk keputusan operasional yang lebih baik.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Tingkat Efisiensi</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">98.7%</p>
                  <p className="mt-2 text-sm text-slate-600">Capaian performa pengiriman bulan ini.</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Status Jaringan</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">Stabil</p>
                  <p className="mt-2 text-sm text-slate-600">Semua koneksi API dan database aktif.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
              >
                + Tambah Rekapan
              </button>
              <button
                onClick={() => {
                  setExportSelectedMonth(startDate ? startDate.slice(0, 7) : '');
                  setExportPreviewRows([]);
                  setExportPeriodLabel('');
                  setExportPreviewOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Export
              </button>
              <input
                ref={(el) => { fileInputRef.current = el; }}
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportLoading(true);
                  try {
                    const buffer = await file.arrayBuffer();
                      const ExcelJS = (await import('exceljs')) as any;
                      const workbook = new ExcelJS.Workbook();
                      await workbook.xlsx.load(buffer);
                    const sheet = workbook.worksheets[0];
                    if (!sheet) throw new Error('File Excel tidak memiliki sheet.');

                    // map headers -> column numbers
                    const headerMap: Record<string, number> = {};
                    let headerRowIndex = 1;
                    const maxScan = Math.min(10, sheet.rowCount || 10);
                    const headerCandidates: Array<{ index: number; matches: number }> = [];

                    for (let r = 1; r <= maxScan; r++) {
                      const row = sheet.getRow(r);
                      let matches = 0;
                      row.eachCell((cell: any) => {
                        const text = (cell.value || '').toString().trim().toLowerCase();
                        if (
                          text.includes('tanggal') ||
                          text.includes('waybill') ||
                          text.includes('provinsi') ||
                          text.includes('jenis') ||
                          text.includes('koli') ||
                          text.includes('jumlah') ||
                          text.includes('berat') ||
                          text.includes('ongkir') ||
                          text.includes('asuransi') ||
                          text.includes('packing') ||
                          text.includes('metode')
                        ) {
                          matches++;
                        }
                      });
                      headerCandidates.push({ index: r, matches });
                    }

                    headerCandidates.sort((a, b) => b.matches - a.matches);
                    if (headerCandidates[0]?.matches >= 2) {
                      headerRowIndex = headerCandidates[0].index;
                    }

                    const headerRow = sheet.getRow(headerRowIndex);
                    headerRow.eachCell((cell: any, colNumber: number) => {
                      const text = (cell.value || '').toString().trim().toLowerCase();
                      headerMap[text] = colNumber;
                    });

                    const mapHeaderToKey = (h: string) => {
                      const s = h.trim().toLowerCase();
                      if (s.includes('tanggal')) return 'tanggal';
                      if (s.includes('waybill')) return 'waybill';
                      if (s.includes('provinsi')) return 'provinsi';
                      if (s.includes('jenis')) return 'jenisBarang';
                      if (s.includes('koli') || s.includes('jumlah')) return 'jumlahKoli';
                      if (s.includes('berat')) return 'beratKg';
                      if (s.includes('ongkir')) return 'ongkir';
                      if (s.includes('asuransi')) return 'asuransi';
                      if (s.includes('packing')) return 'packing';
                      if (s.includes('metode')) return 'metodePembayaran';
                      return '';
                    };

                    // build a reverse map of expected keys -> column index
                    const colForKey: Record<string, number | undefined> = {};
                    Object.keys(headerMap).forEach((h) => {
                      const key = mapHeaderToKey(h);
                      if (key) colForKey[key] = headerMap[h];
                    });

                    const rows = [] as ImportPreviewRow[];
                    for (let i = headerRowIndex + 1; i <= sheet.rowCount; i++) {
                      const row = sheet.getRow(i);
                      // stop if row empty (no waybill)
                      const waybillCell = colForKey['waybill'] ? row.getCell(colForKey['waybill'] as number).value : null;
                      if (!waybillCell || String(waybillCell).trim() === '') continue;

                      const formatCellValue = (val: any) => {
                        if (val === undefined || val === null) return null;
                        if (typeof val === 'string') return val.trim();
                        if (typeof val === 'number') {
                          // keep numeric values as numbers so parsing preserves magnitude
                          return val;
                        }
                        if (val instanceof Date) return val;
                        return String(val).trim();
                      };

                      const getCellValue = (key: string) => {
                        const col = colForKey[key];
                        if (!col) return null;
                        const val = row.getCell(col).value;
                        return formatCellValue(val);
                      };

                      const parseExcelDate = (raw: any): Date | null => {
                        if (!raw && raw !== 0) return null;
                        if (raw instanceof Date) return raw;
                        if (typeof raw === 'number') {
                          const jsTime = (raw - 25569) * 86400 * 1000;
                          return new Date(jsTime);
                        }
                        if (typeof raw === 'string') {
                          const txt = raw.replace(/,/g, ' ').replace(/\./g, ':').trim();
                          const parts = txt.split(/\s+/);
                          const datePart = parts[0] || '';
                          const timePart = parts[1] || '00:00:00';
                          const [day, month, year] = datePart.split('/').map((s) => parseInt(s, 10));
                          const [hh, mm, ss] = timePart.split(':').map((s) => parseInt(s, 10) || 0);
                          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                            const normalizedYear = year < 100 ? 2000 + year : year;
                            return new Date(normalizedYear, (month || 1) - 1, day || 1, hh || 0, mm || 0, ss || 0);
                          }
                        }
                        return null;
                      };

                      // parse date
                      const rawTanggal = getCellValue('tanggal');
                      const tanggal = parseExcelDate(rawTanggal);

                      const parseNumber = (v: any) => {
                        if (v == null || v === '') return 0;
                        if (typeof v === 'number') return v;
                        let s = String(v).trim();
                        if (s === '') return 0;
                        s = s.replace(/[^0-9,.-]/g, '');

                        const hasDot = s.includes('.');
                        const hasComma = s.includes(',');

                        if (hasDot && hasComma) {
                          const lastDot = s.lastIndexOf('.');
                          const lastComma = s.lastIndexOf(',');
                          if (lastDot > lastComma) {
                            // dot as decimal separator, comma as thousands
                            s = s.replace(/,/g, '');
                          } else {
                            // comma as decimal separator, dot as thousands
                            s = s.replace(/\./g, '').replace(',', '.');
                          }
                        } else if (hasComma) {
                          if ((s.match(/,/g) || []).length === 1 && !hasDot) {
                            s = s.replace(',', '.');
                          } else {
                            s = s.replace(/,/g, '');
                          }
                        } else {
                          s = s.replace(/\./g, '');
                        }

                        const n = parseFloat(s);
                        return isNaN(n) ? 0 : n;
                      };

                        const parseWeight = (v: any) => {
                          if (v == null || v === '') return 0;
                          if (typeof v === 'number') return v; // assume already kg
                          let s = String(v).toLowerCase().trim();
                          // detect unit
                          const hasTon = /ton|t(?![a-z])/i.test(s);
                          const hasKg = /kg/i.test(s);
                          const hasGram = /g\b|gram/i.test(s);

                          // remove unit words before numeric parsing
                          s = s.replace(/[^0-9,.-]/g, '');
                          const base = parseNumber(s);
                          if (hasTon) return base * 1000;
                          if (hasGram) return base / 1000;
                          // default assume kg
                          return base;
                        };

                      const parseInteger = (v: any) => {
                        const n = parseNumber(v);
                        return Number.isFinite(n) ? Math.round(n) : 0;
                      };

                      const metodeRaw = getCellValue('metodePembayaran');
                      const metodeStr = metodeRaw
                        ? String(metodeRaw)
                            .toUpperCase()
                            .replace(/[^A-Z0-9]+/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '')
                        : '';
                      const methodMap: Record<string, MetodePembayaran | undefined> = {
                        TRANSFER: MetodePembayaran.TRANSFER,
                        CASH: MetodePembayaran.CASH,
                        TF_CASH: MetodePembayaran.TF_CASH,
                        TFPLUSCASH: MetodePembayaran.TF_CASH,
                        TF_PLUS_CASH: MetodePembayaran.TF_CASH,
                        TF: MetodePembayaran.TF_CASH,
                        PICKUP_ONLINE: MetodePembayaran.PICKUP_ONLINE,
                        PICKUP: MetodePembayaran.PICKUP_ONLINE,
                        BULANAN: MetodePembayaran.BULANAN,
                        DFOD: MetodePembayaran.DFOD,
                      };

                      const rowErrors: string[] = [];
                      const waybillValue = String(getCellValue('waybill') || '').trim();
                      const provinsiValue = String(getCellValue('provinsi') || '').trim();
                      const jenisBarangValue = String(getCellValue('jenisBarang') || '').trim();
                      const jumlahKoliValue = parseInteger(getCellValue('jumlahKoli')) || 0;
                      const rawBerat = getCellValue('beratKg');
                      const beratKgValue = parseWeight(rawBerat) || 0;
                      const rawOngkir = getCellValue('ongkir');
                      const ongkirValue = parseInteger(rawOngkir) || 0;
                      const rawAsuransi = getCellValue('asuransi');
                      const asuransiValue = parseInteger(rawAsuransi) || 0;
                      const rawPacking = getCellValue('packing');
                      const packingValue = parseInteger(rawPacking) || 0;
                      const mappedMetode = methodMap[metodeStr];

                      if (!tanggal || !(tanggal instanceof Date) || Number.isNaN(tanggal.getTime())) {
                        rowErrors.push('Tanggal tidak valid');
                      }
                      if (!waybillValue) {
                        rowErrors.push('Waybill kosong');
                      }
                      if (!provinsiValue) {
                        rowErrors.push('Provinsi kosong');
                      }
                      if (!jenisBarangValue) {
                        rowErrors.push('Jenis Barang kosong');
                      }
                      if (jumlahKoliValue <= 0) {
                        rowErrors.push('Jumlah Koli harus > 0');
                      }
                      if (beratKgValue <= 0) {
                        rowErrors.push('Berat harus > 0');
                      }
                      if (ongkirValue < 0) {
                        rowErrors.push('Ongkir tidak boleh negatif');
                      }
                      if (asuransiValue < 0) {
                        rowErrors.push('Asuransi tidak boleh negatif');
                      }
                      if (packingValue < 0) {
                        rowErrors.push('Packing tidak boleh negatif');
                      }
                      if (!mappedMetode || !isValidMetodePembayaran(mappedMetode)) {
                        rowErrors.push('Metode Pembayaran tidak valid');
                      }

                      rows.push({
                        tanggal: tanggal || new Date(),
                        waybill: waybillValue,
                        provinsi: provinsiValue,
                        jenisBarang: jenisBarangValue,
                        jumlahKoli: jumlahKoliValue,
                        beratKg: beratKgValue,
                        ongkir: ongkirValue,
                        asuransi: asuransiValue,
                        packing: packingValue,
                        metodePembayaran: mappedMetode || MetodePembayaran.TRANSFER,
                        rowIndex: i,
                        valid: rowErrors.length === 0,
                        errors: rowErrors,
                        rawMetodePembayaran: metodeRaw ? String(metodeRaw) : null,
                        // keep raw numeric inputs for review
                        rawValues: {
                          berat: rawBerat,
                          ongkir: rawOngkir,
                          asuransi: rawAsuransi,
                          packing: rawPacking,
                        },
                      });
                    }

                    if (rows.length === 0) {
                      toast('Tidak ada baris data yang terdeteksi untuk diimpor.', 'error');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      return;
                    }

                    setImportPreviewRows(rows);
                    setImportFileName(file.name);
                    setImportPreviewOpen(true);
                  } catch (err) {
                    toast(getFriendlyErrorMessage(err), 'error');
                  } finally {
                    setImportLoading(false);
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {importLoading ? 'Memuat...' : 'Import Excel'}
              </button>
            </div>
          </section>

          {importPreviewOpen && (
            <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
              <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Preview Import Excel</h3>
                      <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                        <p className="text-sm text-slate-500">
                          File: {importFileName} · {importPreviewRows.length} baris terdeteksi. {importValidRows.length} valid, {importInvalidRows.length} invalid.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tampilkan:</span>
                          <button
                            type="button"
                            onClick={() => setShowOnlyInvalidImportRows(false)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${showOnlyInvalidImportRows ? 'border-slate-300 bg-white text-slate-700' : 'border-sky-600 bg-sky-600 text-white'}`}
                          >
                            Semua
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowOnlyInvalidImportRows(true)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${showOnlyInvalidImportRows ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
                          >
                            Hanya Invalid
                          </button>
                        </div>
                      </div>
                      {importInvalidRows.length > 0 ? (
                        <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          <p className="font-semibold">Baris invalid terdeteksi</p>
                          <p className="mt-2">Lihat daftar baris invalid di bawah untuk perbaikan.</p>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportPreviewOpen(false);
                        setImportPreviewRows([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-4">
                    <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Baris</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{importPreviewRows.length}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4 shadow-sm sm:col-span-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">File</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 truncate">{importFileName}</p>
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">No</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Baris Excel</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Waybill</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Provinsi</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Jenis Barang</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Koli</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Berat</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Ongkir</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Metode</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Raw Metode</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Detail Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {importDisplayRows.slice(0, 8).map((row, index) => (
                          <tr key={index} className={row.valid ? 'hover:bg-slate-50' : 'bg-rose-50 hover:bg-rose-100'}>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{index + 1}</td>
                            <td className="px-4 py-3 text-slate-700">{row.rowIndex}</td>
                            <td className="px-4 py-3 text-slate-700">{row.tanggal.toLocaleDateString('id-ID')} {row.tanggal.toLocaleTimeString('id-ID')}</td>
                            <td className="px-4 py-3 text-slate-700">{row.waybill}</td>
                            <td className="px-4 py-3 text-slate-700">{row.provinsi}</td>
                            <td className="px-4 py-3 text-slate-700">{row.jenisBarang}</td>
                            <td className="px-4 py-3 text-slate-700">{row.jumlahKoli}</td>
                            <td className="px-4 py-3 text-slate-700">{row.beratKg}</td>
                            <td className="px-4 py-3 text-slate-700">{row.ongkir}</td>
                            <td className="px-4 py-3 text-slate-700">{row.metodePembayaran}</td>
                            <td className="px-4 py-3 text-slate-700">{row.rawMetodePembayaran || '-'}</td>
                            <td className="px-4 py-3">
                              {row.valid ? (
                                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Valid</span>
                              ) : (
                                <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Invalid</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {row.errors.length > 0 ? row.errors.join(', ') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importDisplayRows.length > 8 && (
                      <div className="p-4 text-sm text-slate-500">Menampilkan 8 dari {importDisplayRows.length} baris.</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setImportPreviewOpen(false);
                      setImportPreviewRows([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (importInvalidRows.length > 0) {
                        toast(`Terdapat ${importInvalidRows.length} baris invalid. Perbaiki sebelum import.`, 'error');
                        return;
                      }

                      const rowsToImport = importPreviewRows.filter((row) => row.valid);
                      if (rowsToImport.length === 0) {
                        toast('Tidak ada baris valid untuk diimpor.', 'error');
                        return;
                      }

                      setImportPreviewOpen(false);
                      setImportLoading(true);
                      try {
                        // send batch to server for atomic validation & insert
                        const payload = rowsToImport.map((r) => ({
                          tanggal: r.tanggal,
                          waybill: r.waybill,
                          provinsi: r.provinsi,
                          jenisBarang: r.jenisBarang,
                          jumlahKoli: r.jumlahKoli,
                          beratKg: r.beratKg,
                          ongkir: r.ongkir,
                          asuransi: r.asuransi,
                          packing: r.packing,
                          metodePembayaran: r.metodePembayaran,
                          rowIndex: r.rowIndex,
                        }));

                        const resp = await apiClient.importRekapan(payload as any);
                        if (resp && resp.success) {
                          toast(resp.message || `${payload.length} baris berhasil diimpor.`, 'success');
                          // refresh listing and summary automatically
                          handleRefreshData();
                          try {
                            queryClient.invalidateQueries({ queryKey: ['rekapan'] });
                            queryClient.invalidateQueries({ queryKey: ['rekapan-summary'] });
                          } catch (e) {
                            // ignore
                          }
                        }
                      } catch (err: any) {
                        // if server returned validation errors
                        if (err?.response?.data && err.response.data.errors) {
                          const details = err.response.data.errors.map((e: any) => `Baris ${e.rowIndex}: ${e.errors.join('; ')}`);
                          toast(`Validasi server gagal: ${details.slice(0, 3).join(' | ')}`, 'error');
                        } else {
                          toast(getFriendlyErrorMessage(err), 'error');
                        }
                      } finally {
                        setImportLoading(false);
                        setImportPreviewRows([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                    disabled={importLoading || importInvalidRows.length > 0}
                    className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition ${importInvalidRows.length > 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
                  >
                    {importLoading ? 'Mengimpor...' : importInvalidRows.length > 0 ? 'Perbaiki Dulu' : 'Konfirmasi Import'}
                  </button>
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
                        Bulan terpilih: <span className="font-semibold text-slate-900">{exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'Belum dipilih'}</span>
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
                            const resp = await apiClient.getRekapanList(
                              1,
                              10000,
                              searchTerm || undefined,
                              range.startDate,
                              range.endDate,
                              provinsi || undefined,
                              metodePembayaran || undefined,
                              sortBy || undefined,
                              sortOrder || undefined,
                              true // all
                            );
                            const items = (resp.data as RekapanOutgoing[]) || [];
                            // debug: ids returned by export fetch
                            // eslint-disable-next-line no-console
                            console.debug('Export preview - ids', items.map((it) => it.id));
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
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Waybill</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Provinsi</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Jenis Barang</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Koli</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Berat</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Ongkir</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Asuransi</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Packing</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Metode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {exportPreviewRows.slice(0, 8).map((row, index) => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{index + 1}</td>
                              <td className="px-4 py-3 text-slate-700">{new Date(row.tanggal).toLocaleDateString('id-ID')} {new Date(row.tanggal).toLocaleTimeString('id-ID')}</td>
                              <td className="px-4 py-3 text-slate-700">{row.waybill}</td>
                              <td className="px-4 py-3 text-slate-700">{row.provinsi}</td>
                              <td className="px-4 py-3 text-slate-700">{row.jenisBarang}</td>
                              <td className="px-4 py-3 text-slate-700">{row.jumlahKoli}</td>
                              <td className="px-4 py-3 text-slate-700">{row.beratKg}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.ongkir)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.asuransi)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.packing)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatCurrency(row.total)}</td>
                              <td className="px-4 py-3 text-slate-700">{row.metodePembayaran}</td>
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
                      setExportLoading(true);
                      try {
                        const ExcelJS = (await import('exceljs')) as any;
                        const workbook = new ExcelJS.Workbook();
                        const worksheet = workbook.addWorksheet('Rekapan');

                        // Set column widths
                        worksheet.columns = [
                          { header: 'Tanggal', key: 'tanggal', width: 18 },
                          { header: 'Waybill', key: 'waybill', width: 18 },
                          { header: 'Provinsi', key: 'provinsi', width: 16 },
                          { header: 'Jenis Barang', key: 'jenisBarang', width: 18 },
                          { header: 'Jumlah Koli', key: 'jumlahKoli', width: 14 },
                          { header: 'Berat (kg)', key: 'beratKg', width: 14 },
                          { header: 'Ongkir', key: 'ongkir', width: 14 },
                          { header: 'Asuransi', key: 'asuransi', width: 14 },
                          { header: 'Packing', key: 'packing', width: 14 },
                          { header: 'Total', key: 'total', width: 16 },
                          { header: 'Metode Pembayaran', key: 'metodePembayaran', width: 18 },
                        ];

                        // Add title row
                        const titleRow = worksheet.addRow(['REKAPAN PENGIRIMAN OUTGOING']);
                        titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
                        titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
                        titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
                        worksheet.mergeCells('A1:K1');
                        titleRow.height = 28;

                        // Add period info row
                        const periodRow = worksheet.addRow([`Periode Rekap: ${exportPeriodLabel}`]);
                        periodRow.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
                        periodRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9F4FF' } };
                        periodRow.alignment = { horizontal: 'left', vertical: 'middle' };
                        worksheet.mergeCells('A2:K2');
                        periodRow.height = 20;

                        // Add empty row for spacing
                        worksheet.addRow([]);

                        // Set up columns header (row 4)
                        const headerRow = worksheet.addRow([
                          'Tanggal', 'Waybill', 'Provinsi', 'Jenis Barang', 'Jumlah Koli',
                          'Berat (kg)', 'Ongkir', 'Asuransi', 'Packing', 'Total', 'Metode Pembayaran'
                        ]);
                        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
                        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF264879' } };
                        headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        headerRow.height = 28;
                        headerRow.eachCell((cell: any) => {
                          cell.border = {
                            top: { style: 'thin', color: { argb: 'FFB4C6E7' } },
                            bottom: { style: 'thin', color: { argb: 'FFB4C6E7' } },
                            left: { style: 'thin', color: { argb: 'FFB4C6E7' } },
                            right: { style: 'thin', color: { argb: 'FFB4C6E7' } },
                          };
                        });

                        // Initialize totals
                        let totalKoli = 0;
                        let totalBerat = 0;
                        let totalOngkir = 0;
                        let totalAsuransi = 0;
                        let totalPacking = 0;
                        let totalKeseluruhan = 0;
                        // DFOD / non-DFOD breakdown
                        let totalOngkirDFOD = 0;
                        let totalAsuransiDFOD = 0;
                        let totalPackingDFOD = 0;
                        let totalKeseluruhanDFOD = 0;
                        let totalOngkirNonDFOD = 0;
                        let totalAsuransiNonDFOD = 0;
                        let totalPackingNonDFOD = 0;
                        let totalKeseluruhanNonDFOD = 0;

                        exportPreviewRows.forEach((item, idx) => {
                          const tanggalValue = item.tanggal ? new Date(item.tanggal) : null;
                          const rowData = [
                            tanggalValue instanceof Date && !isNaN(tanggalValue.getTime()) ? tanggalValue : item.tanggal,
                            item.waybill,
                            item.provinsi,
                            item.jenisBarang,
                            item.jumlahKoli,
                            item.beratKg,
                            item.ongkir,
                            item.asuransi,
                            item.packing,
                            item.total,
                            item.metodePembayaran,
                          ];
                          const row = worksheet.addRow(rowData);
                          row.font = { size: 10 };
                          row.alignment = { horizontal: 'left', vertical: 'middle' };

                          // Alternate row background for readability
                          if (idx % 2 !== 0) {
                            row.eachCell((cell: any) => {
                              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F8FF' } };
                            });
                          }

                          // Format number columns
                          row.getCell(5).alignment = { horizontal: 'center' };
                          row.getCell(6).alignment = { horizontal: 'right' };
                          (row.getCell(7) as any).numFmt = '#,##0';
                          row.getCell(7).alignment = { horizontal: 'right' };
                          (row.getCell(8) as any).numFmt = '#,##0';
                          row.getCell(8).alignment = { horizontal: 'right' };
                          (row.getCell(9) as any).numFmt = '#,##0';
                          row.getCell(9).alignment = { horizontal: 'right' };
                          (row.getCell(10) as any).numFmt = '#,##0';
                          row.getCell(10).alignment = { horizontal: 'right' };

                          row.eachCell((cell: any) => {
                            cell.border = {
                              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                              right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            };
                          });

                          // Calculate totals
                          totalKoli += item.jumlahKoli;
                          totalBerat += item.beratKg;
                          totalOngkir += item.ongkir;
                          totalAsuransi += item.asuransi;
                          totalPacking += item.packing;
                          totalKeseluruhan += item.total;
                          if (String(item.metodePembayaran).toUpperCase() === 'DFOD') {
                            totalOngkirDFOD += item.ongkir;
                            totalAsuransiDFOD += item.asuransi;
                            totalPackingDFOD += item.packing;
                            totalKeseluruhanDFOD += item.total;
                          } else {
                            totalOngkirNonDFOD += item.ongkir;
                            totalAsuransiNonDFOD += item.asuransi;
                            totalPackingNonDFOD += item.packing;
                            totalKeseluruhanNonDFOD += item.total;
                          }
                        });

                        // Add spacing before totals
                        worksheet.addRow([]);

                        const totalRow = worksheet.addRow([
                          'TOTAL',
                          `Total Waybill: ${exportPreviewRows.length}`,
                          '',
                          '',
                          totalKoli,
                          totalBerat.toFixed(2),
                          totalOngkir,
                          totalAsuransi,
                          totalPacking,
                          totalKeseluruhan,
                          '',
                        ]);
                        totalRow.font = { bold: true, size: 11 };
                        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
                        totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
                        totalRow.eachCell((cell: any) => {
                          cell.border = {
                            top: { style: 'thin', color: { argb: 'FFB7C9E2' } },
                            bottom: { style: 'thin', color: { argb: 'FFB7C9E2' } },
                            left: { style: 'thin', color: { argb: 'FFB7C9E2' } },
                            right: { style: 'thin', color: { argb: 'FFB7C9E2' } },
                          };
                        });
                        totalRow.getCell(1).alignment = { horizontal: 'left' };
                        totalRow.getCell(5).alignment = { horizontal: 'center' };
                        (totalRow.getCell(5) as any).numFmt = '0';
                        totalRow.getCell(6).alignment = { horizontal: 'right' };
                        (totalRow.getCell(6) as any).numFmt = '0.00';
                        totalRow.getCell(7).alignment = { horizontal: 'right' };
                        (totalRow.getCell(7) as any).numFmt = '#,##0';
                        totalRow.getCell(8).alignment = { horizontal: 'right' };
                        (totalRow.getCell(8) as any).numFmt = '#,##0';
                        totalRow.getCell(9).alignment = { horizontal: 'right' };
                        (totalRow.getCell(9) as any).numFmt = '#,##0';
                        totalRow.getCell(10).alignment = { horizontal: 'right' };
                        (totalRow.getCell(10) as any).numFmt = '#,##0';

                        // Add summary section
                        worksheet.addRow([]);
                        const summaryHeaderRow = worksheet.addRow(['RINGKASAN', '']);
                        summaryHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
                        summaryHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF264879' } };
                        summaryHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
                        worksheet.mergeCells(`A${summaryHeaderRow.number}:D${summaryHeaderRow.number}`);
                        worksheet.getRow(summaryHeaderRow.number).height = 22;

                        const summaryData = [
                          { label: 'Total Waybill', value: exportPreviewRows.length, format: '#,##0' },
                          { label: 'Total Koli', value: totalKoli, format: '#,##0' },
                          { label: 'Total Berat (kg)', value: totalBerat, format: '0.00' },
                          { label: 'Total Ongkir (Non-DFOD)', value: totalOngkirNonDFOD, format: '#,##0' },
                          { label: 'Total Asuransi (Non-DFOD)', value: totalAsuransiNonDFOD, format: '#,##0' },
                          { label: 'Total Packing (Non-DFOD)', value: totalPackingNonDFOD, format: '#,##0' },
                          { label: 'Total Keseluruhan (Non-DFOD)', value: totalKeseluruhanNonDFOD, format: '#,##0' },
                          { label: 'Total Ongkir (DFOD)', value: totalOngkirDFOD, format: '#,##0' },
                          { label: 'Total Asuransi (DFOD)', value: totalAsuransiDFOD, format: '#,##0' },
                          { label: 'Total Packing (DFOD)', value: totalPackingDFOD, format: '#,##0' },
                          { label: 'Total Keseluruhan (DFOD)', value: totalKeseluruhanDFOD, format: '#,##0' },
                          { label: 'Total Ongkir (All)', value: totalOngkir, format: '#,##0' },
                          { label: 'Total Asuransi (All)', value: totalAsuransi, format: '#,##0' },
                          { label: 'Total Packing (All)', value: totalPacking, format: '#,##0' },
                          { label: 'Total Keseluruhan (All)', value: totalKeseluruhan, format: '#,##0' },
                        ];

                        summaryData.forEach((item, index) => {
                          const summaryRow = worksheet.addRow([item.label, item.value]);
                          summaryRow.getCell(1).font = { bold: index < 3, size: index < 3 ? 11 : 10 };
                          summaryRow.getCell(2).font = { bold: index < 3, size: index < 3 ? 11 : 10 };
                          summaryRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
                          summaryRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
                          summaryRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFF7FBFF' : 'FFFFFFFF' } };
                          summaryRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFF7FBFF' : 'FFFFFFFF' } };
                          (summaryRow.getCell(2) as any).numFmt = item.format;
                          summaryRow.eachCell((cell: any) => {
                            cell.border = {
                              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                              right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            };
                          });
                        });

                        // Freeze header and title rows
                        worksheet.views = [{ state: 'frozen', ySplit: 4 }];

                        const buffer = await workbook.xlsx.writeBuffer();
                        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        const safeLabel = exportPeriodLabel.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'rekapan_export';
                        link.href = url;
                        link.download = `rekapan_${safeLabel}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        URL.revokeObjectURL(url);
                        setExportPreviewOpen(false);
                        setExportPreviewRows([]);
                        setExportSelectedMonth('');
                        setExportPeriodLabel('');
                        toast('Export Excel berhasil disiapkan.', 'success');
                      } catch (err) {
                        toast(getFriendlyErrorMessage(err), 'error');
                      } finally {
                        setExportLoading(false);
                      }
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

          {showForm && (
            <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-200 max-h-[calc(100vh-4rem)] flex flex-col">
                <RekapanForm editingId={editingId} onClose={handleFormClose} onDataChange={handleRefreshData} />
              </div>
            </div>
          )}


          <SummaryCards startDate={startDate} endDate={endDate} />

          <section className="grid gap-8 xl:grid-cols-[1.45fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Filter dan Cari</h2>
                  <p className="mt-1 text-sm text-slate-500">Temukan rekapan berdasarkan kata kunci dan rentang tanggal.</p>
                </div>
              </div>
              <div className="mt-6">
                <SearchFilters
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  startDate={startDate}
                  onStartDateChange={handleStartDateChange}
                  endDate={endDate}
                  onEndDateChange={handleEndDateChange}
                  provinsi={provinsi}
                  onProvinsiChange={handleProvinsiChange}
                  metodePembayaran={metodePembayaran}
                  onMetodeChange={handleMetodePembayaranChange}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  sortOrder={sortOrder}
                  onSortOrderChange={(s) => setSortOrder(s as 'asc' | 'desc')}
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Ringkasan Filter</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="rounded-3xl bg-white p-4 shadow-sm">Pencarian: <span className="font-semibold text-slate-900">{searchTerm || 'Semua data'}</span></div>
                <div className="rounded-3xl bg-white p-4 shadow-sm">Tanggal: <span className="font-semibold text-slate-900">{startDate || 'Awal'} - {endDate || 'Sekarang'}</span></div>
                <div className="rounded-3xl bg-white p-4 shadow-sm">Halaman: <span className="font-semibold text-slate-900">{currentPage}</span></div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Daftar Rekapan</h2>
                <p className="mt-1 text-sm text-slate-500">Kelola data pengiriman dengan cepat dan aman.</p>
              </div>
            </div>
            <RekapanTable
              searchTerm={searchTerm}
              startDate={startDate}
              endDate={endDate}
              currentPage={currentPage}
              refreshKey={refreshKey}
              onPageChange={setCurrentPage}
              onEdit={handleEdit}
              highlightId={editingId}
              onDataChange={handleRefreshData}
              provinsi={provinsi}
              metodePembayaran={metodePembayaran}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
