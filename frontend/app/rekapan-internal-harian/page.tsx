'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Header from '@/components/Header';
import InternalForm from '@/components/InternalForm';
import InternalTable from '@/components/InternalTable';
import { useInternalSummary } from '@/hooks/useInternal';
import { apiClient } from '@/lib/api';
import { formatNumber, formatDate, getFriendlyErrorMessage } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import type { CreateRekapanInternalInput, RekapanInternalRecord } from '../../types/internal';

export default function RekapanInternalHarianPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState<any[]>([]);
  const [exportPeriodLabel, setExportPeriodLabel] = useState('');
  const [exportPreviewLoading, setExportPreviewLoading] = useState(false);
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<CreateRekapanInternalInput[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const summaryResponse = useInternalSummary(startDate || undefined, endDate || undefined);
  const summaryData = summaryResponse.data?.data;

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

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDataChange = () => {
    setRefreshKey((value) => value + 1);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const ExcelJS = (await import('exceljs')) as any;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error('File Excel tidak memiliki sheet.');

      // Step 1: Find header row
      let headerRowIndex = 1;
      const maxScan = Math.min(15, sheet.rowCount || 15);
      
      // Scan for row with most non-empty cells
      let maxFilledCells = 0;
      for (let rowIndex = 1; rowIndex <= maxScan; rowIndex += 1) {
        const row = sheet.getRow(rowIndex);
        let filledCells = 0;
        row.eachCell((cell: any) => {
          if (cell.value && String(cell.value).trim().length > 0) filledCells++;
        });
        if (filledCells > maxFilledCells) {
          maxFilledCells = filledCells;
          headerRowIndex = rowIndex;
        }
      }

      // Step 2: Extract headers
      const headerRow = sheet.getRow(headerRowIndex);
      const headers: string[] = [];
      headerRow.eachCell((cell: any, colNumber: number) => {
        const text = (cell.value || '').toString().trim();
        headers[colNumber - 1] = text;
      });

      // Step 3: Extract ALL data rows (not just preview)
      const allData: Record<string, any>[] = [];
      for (let rowIndex = headerRowIndex + 1; rowIndex <= sheet.rowCount; rowIndex += 1) {
        const row = sheet.getRow(rowIndex);
        const rowData: Record<string, any> = {};
        let hasData = false;
        
        headers.forEach((header, idx) => {
          const cellValue = row.getCell(idx + 1).value;
          rowData[header] = cellValue;
          if (cellValue && String(cellValue).trim().length > 0) {
            hasData = true;
          }
        });
        
        // Only add rows with data
        if (hasData) {
          allData.push(rowData);
        }
      }

      // Store for column selector (all data, not just preview)
      setRawExcelData(allData);
      setExcelHeaders(headers.filter(h => h && h.length > 0));
      setImportFileName(file.name);
      
      // Auto-map columns based on keywords
      const autoMapping: Record<string, number> = {};
      headers.forEach((header, idx) => {
        if (!header) return;
        const lower = header.toLowerCase();
        
        if (!autoMapping.waybill && (lower.includes('waybill') || lower.includes('kode'))) 
          autoMapping.waybill = idx;
        if (!autoMapping.sprinterDelivery && lower.includes('sprinter')) 
          autoMapping.sprinterDelivery = idx;
        if (!autoMapping.tanggalRekap && (lower.includes('ttd') || lower.includes('waktu'))) 
          autoMapping.tanggalRekap = idx;
        if (!autoMapping.jumlahKoli && lower.includes('koli')) 
          autoMapping.jumlahKoli = idx;
        if (!autoMapping.jumlahPembayaranCOD && lower.includes('cod')) 
          autoMapping.jumlahPembayaranCOD = idx;
        if (!autoMapping.biayaDFOD && lower.includes('dfod')) 
          autoMapping.biayaDFOD = idx;
      });

      setColumnMapping(autoMapping);
      setShowColumnSelector(true);
      toast(`Ditemukan ${allData.length} baris data di Excel`, 'success');
    } catch (error) {
      toast(getFriendlyErrorMessage(error), 'error');
    } finally {
      setImportLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleProcessImport = () => {
    if (!columnMapping.waybill && columnMapping.waybill !== 0) {
      toast('Pilih kolom Waybill terlebih dahulu', 'error');
      return;
    }

    const parseStringValue = (value: any): string => {
      if (!value && value !== 0) return '';
      if (value && typeof value === 'object' && value.richText && Array.isArray(value.richText)) {
        return value.richText.map((rt: any) => rt.text).join('').trim();
      }
      return String(value || '').trim();
    };

    const parseDateValue = (value: any): string => {
      if (!value && value !== 0) return '';
      
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
      }
      
      if (typeof value === 'number') {
        if (value > 100 && value < 100000) {
          const jsDate = new Date((value - 25569) * 86400 * 1000);
          const dateStr = jsDate.toISOString().slice(0, 10);
          if (dateStr.match(/^20\d{2}-\d{2}-\d{2}$/)) {
            return dateStr;
          }
        }
      }
      
      const strValue = parseStringValue(value);
      const dateMatch = strValue.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        return dateMatch[1];
      }
      return strValue;
    };

    const parseNumberValue = (value: any): number => {
      if (value === undefined || value === null || value === '') return 0;
      if (typeof value === 'number') return Math.floor(value);
      
      const strValue = parseStringValue(value);
      if (!strValue) return 0;
      
      const parsed = Number(strValue.replace(/[^0-9.-]/g, ''));
      return Number.isNaN(parsed) ? 0 : Math.floor(parsed);
    };

    // Process data with selected column mapping
    const rows: CreateRekapanInternalInput[] = [];
    rawExcelData.forEach((rowData) => {
      const waybillValue = columnMapping.waybill !== undefined 
        ? parseStringValue(rowData[excelHeaders[columnMapping.waybill]])
        : '';
      
      if (!waybillValue) return;

      rows.push({
        tanggalRekap: columnMapping.tanggalRekap !== undefined 
          ? parseDateValue(rowData[excelHeaders[columnMapping.tanggalRekap]])
          : '',
        waybill: waybillValue,
        sprinterDelivery: columnMapping.sprinterDelivery !== undefined
          ? parseStringValue(rowData[excelHeaders[columnMapping.sprinterDelivery]])
          : '',
        jumlahKoli: columnMapping.jumlahKoli !== undefined
          ? parseNumberValue(rowData[excelHeaders[columnMapping.jumlahKoli]])
          : 0,
        jumlahPembayaranCOD: columnMapping.jumlahPembayaranCOD !== undefined
          ? parseNumberValue(rowData[excelHeaders[columnMapping.jumlahPembayaranCOD]])
          : 0,
        biayaDFOD: columnMapping.biayaDFOD !== undefined
          ? parseNumberValue(rowData[excelHeaders[columnMapping.biayaDFOD]])
          : 0,
      });
    });

    if (rows.length === 0) {
      toast('Tidak ada data valid yang ditemukan setelah mapping kolom.', 'error');
      return;
    }

    setImportPreviewRows(rows);
    setShowColumnSelector(false);
    setImportPreviewOpen(true);
    toast(`Berhasil memproses ${rows.length} baris data`, 'success');
  };

  const handleImportSubmit = async () => {
    if (importPreviewRows.length === 0) return;

    setImportLoading(true);
    try {
      const response = await apiClient.importRekapanInternal(importPreviewRows);
      toast(response.message || 'Import rekapan internal berhasil.', 'success');
      setImportPreviewOpen(false);
      setImportPreviewRows([]);
      setImportFileName('');
      queryClient.invalidateQueries({ queryKey: ['rekapan-internal'] });
      queryClient.invalidateQueries({ queryKey: ['rekapan-internal-summary'] });
      handleDataChange();
    } catch (error) {
      toast(getFriendlyErrorMessage(error), 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const computePeriodLabel = (start: string, end: string) => {
    if (!start && !end) return 'Semua waktu';
    const startDate = start ? new Date(start).toLocaleDateString('id-ID') : '...';
    const endDate = end ? new Date(end).toLocaleDateString('id-ID') : '...';
    return `${startDate} - ${endDate}`;
  };

  const handleLoadExportPreview = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast('Pilih tanggal awal dan akhir terlebih dahulu.', 'error');
      return;
    }

    setExportPreviewLoading(true);
    try {
      const response = await apiClient.getRekapanInternalList(1, 10000, '', exportStartDate, exportEndDate);
      const items = response.data as RekapanInternalRecord[] || [];
      
      if (items.length === 0) {
        toast('Tidak ada data untuk periode tersebut.', 'error');
        setExportPreviewRows([]);
        setExportPeriodLabel('');
        return;
      }
      
      setExportPreviewRows(items);
      setExportPeriodLabel(computePeriodLabel(exportStartDate, exportEndDate));
      setExportPreviewOpen(true);
      toast(`Ditemukan ${items.length} baris data`, 'success');
    } catch (error) {
      toast(getFriendlyErrorMessage(error), 'error');
      setExportPreviewRows([]);
    } finally {
      setExportPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    if (exportPreviewRows.length === 0) {
      toast('Tampilkan preview terlebih dahulu sebelum download.', 'error');
      return;
    }

    setExportLoading(true);
    try {
      const ExcelJS = (await import('exceljs')) as any;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rekapan Internal');

      const parseExcelDateValue = (value: string | Date | undefined) => {
        if (!value) return '';
        if (value instanceof Date) return value;
        const normalized = String(value).trim();
        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) return parsed;

        const parts = normalized.split(/[\/\-.]/).map((p) => p.trim());
        if (parts.length === 3) {
          const [first, second, third] = parts;
          if (third.length === 4) {
            const day = Number(first);
            const month = Number(second) - 1;
            const year = Number(third);
            const fallbackDate = new Date(year, month, day);
            if (!Number.isNaN(fallbackDate.getTime())) return fallbackDate;
          }
        }
        return normalized;
      };

      // Set column widths
      worksheet.columns = [
        { header: 'Tanggal', key: 'tanggalRekap', width: 14 },
        { header: 'Waybill', key: 'waybill', width: 18 },
        { header: 'Sprinter Delivery', key: 'sprinterDelivery', width: 18 },
        { header: 'Jumlah Koli', key: 'jumlahKoli', width: 14 },
        { header: 'Jumlah COD', key: 'jumlahPembayaranCOD', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Biaya DFOD', key: 'biayaDFOD', width: 14, style: { numFmt: '#,##0' } },
      ];
      worksheet.getColumn('tanggalRekap').numFmt = 'dd/mm/yyyy';

      // Add title row
      const titleRow = worksheet.addRow(['REKAPAN INTERNAL HARIAN']);
      titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells('A1:F1');
      titleRow.height = 28;

      // Add period info row
      const periodRow = worksheet.addRow([`Periode: ${exportPeriodLabel}`]);
      periodRow.font = { bold: true, size: 11 };
      periodRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4F8' } };
      periodRow.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.mergeCells('A2:F2');
      periodRow.height = 20;

      // Add empty row
      worksheet.addRow([]);

      // Add header row (row 4)
      const headerRow = worksheet.addRow([
        'Tanggal', 'Waybill', 'Sprinter Delivery', 'Jumlah Koli', 'Jumlah COD', 'Biaya DFOD'
      ]);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerRow.height = 24;

      // Add data rows
      let totalKoli = 0;
      let totalCOD = 0;
      let totalDFOD = 0;

      exportPreviewRows.forEach((row) => {
        worksheet.addRow({
          tanggalRekap: parseExcelDateValue(row.tanggalRekap),
          waybill: row.waybill,
          sprinterDelivery: row.sprinterDelivery,
          jumlahKoli: row.jumlahKoli,
          jumlahPembayaranCOD: row.jumlahPembayaranCOD,
          biayaDFOD: row.biayaDFOD,
        });
        totalKoli += row.jumlahKoli || 0;
        totalCOD += row.jumlahPembayaranCOD || 0;
        totalDFOD += row.biayaDFOD || 0;
      });

      // Add empty row before summary
      worksheet.addRow([]);

      // Add summary row
      const summaryRow = worksheet.addRow([
        'TOTAL',
        '',
        `${exportPreviewRows.length} Waybill`,
        totalKoli,
        totalCOD,
        totalDFOD
      ]);
      summaryRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      summaryRow.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryRow.height = 20;

      // Format data cells
      for (let row = 5; row <= exportPreviewRows.length + 4; row++) {
        worksheet.getRow(row).alignment = { horizontal: 'left', vertical: 'middle' };
        // Format numbers
        worksheet.getCell(`D${row}`).alignment = { horizontal: 'right' };
        worksheet.getCell(`E${row}`).alignment = { horizontal: 'right' };
        worksheet.getCell(`F${row}`).alignment = { horizontal: 'right' };
      }

      // Summary by sprinter sheet
      const sprinterSummary = exportPreviewRows.reduce((acc: Record<string, {
        sprinterDelivery: string;
        waybillCount: number;
        totalKoli: number;
        totalCOD: number;
        totalDFOD: number;
      }>, row) => {
        const key = row.sprinterDelivery || 'Tanpa Sprinter';
        if (!acc[key]) {
          acc[key] = {
            sprinterDelivery: key,
            waybillCount: 0,
            totalKoli: 0,
            totalCOD: 0,
            totalDFOD: 0,
          };
        }
        acc[key].waybillCount += 1;
        acc[key].totalKoli += row.jumlahKoli || 0;
        acc[key].totalCOD += row.jumlahPembayaranCOD || 0;
        acc[key].totalDFOD += row.biayaDFOD || 0;
        return acc;
      }, {} as Record<string, {
        sprinterDelivery: string;
        waybillCount: number;
        totalKoli: number;
        totalCOD: number;
        totalDFOD: number;
      }>);

      const summarySheet = workbook.addWorksheet('Ringkasan Sprinter');
      summarySheet.columns = [
        { header: 'Sprinter Delivery', key: 'sprinterDelivery', width: 24 },
        { header: 'Total Waybill', key: 'waybillCount', width: 16 },
        { header: 'Total Koli', key: 'totalKoli', width: 14 },
        { header: 'Total COD', key: 'totalCOD', width: 14, style: { numFmt: '#,##0' } },
        { header: 'Total DFOD', key: 'totalDFOD', width: 14, style: { numFmt: '#,##0' } },
      ];

      const summaryTitleRow = summarySheet.addRow(['RINGKASAN PER SPRINTER']);
      summaryTitleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      summaryTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      summaryTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.mergeCells('A1:E1');
      summaryTitleRow.height = 28;

      const summaryPeriodRow = summarySheet.addRow([`Periode: ${exportPeriodLabel}`]);
      summaryPeriodRow.font = { bold: true, size: 11 };
      summaryPeriodRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4F8' } };
      summaryPeriodRow.alignment = { horizontal: 'left', vertical: 'middle' };
      summarySheet.mergeCells('A2:E2');
      summaryPeriodRow.height = 20;
      summarySheet.addRow([]);

      const summaryHeaderRow = summarySheet.addRow([
        'Sprinter Delivery', 'Total Waybill', 'Total Koli', 'Total COD', 'Total DFOD'
      ]);
      summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      summaryHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      summaryHeaderRow.height = 24;

      const summaryRows = Object.values(sprinterSummary);
      summaryRows.forEach((group) => {
        summarySheet.addRow({
          sprinterDelivery: group.sprinterDelivery,
          waybillCount: group.waybillCount,
          totalKoli: group.totalKoli,
          totalCOD: group.totalCOD,
          totalDFOD: group.totalDFOD,
        });
      });

      summaryRows.forEach((_, idx) => {
        const rowNumber = idx + 5;
        summarySheet.getRow(rowNumber).alignment = { horizontal: 'left', vertical: 'middle' };
        summarySheet.getCell(`B${rowNumber}`).alignment = { horizontal: 'right' };
        summarySheet.getCell(`C${rowNumber}`).alignment = { horizontal: 'right' };
        summarySheet.getCell(`D${rowNumber}`).alignment = { horizontal: 'right' };
        summarySheet.getCell(`E${rowNumber}`).alignment = { horizontal: 'right' };
      });

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `Rekapan_Internal_${exportPeriodLabel.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.xlsx`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast('Export Excel berhasil disiapkan.', 'success');
      setShowExportModal(false);
      setExportPreviewOpen(false);
      setExportPreviewRows([]);
      setExportStartDate('');
      setExportEndDate('');
      setExportPeriodLabel('');
    } catch (error) {
      toast(getFriendlyErrorMessage(error), 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const headerRight = (
    <div className="flex items-center gap-3">
      <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20">Beranda</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <Header title="Rekapan Internal Harian" subtitle="Laporan Internal" description="Kelola data internal harian dengan upload Excel, ringkasan cepat, dan fungsi edit / hapus." right={headerRight} />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rekapan Internal Harian</h1>
              <p className="mt-2 text-sm text-slate-500">Tambah, ubah, dan lihat data rekapan internal dengan cepat.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setEditingId(null); setShowForm(true); }} className="inline-flex h-12 items-center justify-center rounded-full bg-sky-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">+ Tambah Rekapan</button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={importLoading} className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">{importLoading ? 'Memuat...' : 'Import Excel'}</button>
              <button onClick={() => setShowExportModal(true)} className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Export</button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span>Mulai</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span>Sampai</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Ringkasan</p>
                    <p className="mt-2 text-slate-600">Statistik rekapan internal untuk periode saat ini.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[{
                    label: 'Total AWB',
                    value: formatNumber(summaryData?.totalAwb ?? 0),
                  }, {
                    label: 'Total Koli',
                    value: formatNumber(summaryData?.totalKoli ?? 0),
                  }, {
                    label: 'Total COD',
                    value: formatNumber(summaryData?.totalCOD ?? 0),
                  }, {
                    label: 'Total DFOD',
                    value: formatNumber(summaryData?.totalDFOD ?? 0),
                  }].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
                        </div>
                        <div className="text-right text-2xl font-semibold text-slate-900">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Ringkasan Sprinter</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{startDate || endDate ? `${startDate || '...'} - ${endDate || '...'}` : 'Semua waktu'}</span>
              </div>
              <div className="space-y-3">
                {(summaryData?.bySprinter || []).slice(0, 5).map((group: {
                  sprinterDelivery: string;
                  countAwb: number;
                  totalKoli: number;
                  totalCOD: number;
                  totalDFOD: number;
                }) => (
                  <div key={group.sprinterDelivery} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{group.sprinterDelivery}</p>
                        <p className="mt-1 text-sm text-slate-600">{group.countAwb} AWB</p>
                      </div>
                      <div className="mt-2 text-right text-sm text-slate-700 space-y-1">
                        <p>{formatNumber(group.totalKoli)} koli</p>
                        <p>{formatNumber(group.totalCOD)} COD</p>
                        <p>{formatNumber(group.totalDFOD)} DFOD</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <InternalTable
              searchTerm={searchTerm}
              startDate={startDate}
              endDate={endDate}
              currentPage={currentPage}
              refreshKey={refreshKey}
              onPageChange={setCurrentPage}
              onEdit={handleEdit}
              onDataChange={handleDataChange}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <InternalForm
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onDataChange={handleDataChange}
        />
      )}

      {showColumnSelector && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 px-4 py-6">
          <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Pilih Kolom Excel</h3>
                <p className="mt-1 text-sm text-slate-500">Tentukan kolom mana yang sesuai dengan data Anda. File: {importFileName}</p>
              </div>
              <button type="button" onClick={() => setShowColumnSelector(false)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tutup</button>
            </div>

            <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2">
                {['waybill', 'sprinterDelivery', 'tanggalRekap', 'jumlahKoli', 'jumlahPembayaranCOD', 'biayaDFOD'].map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {key === 'waybill' && 'Waybill'}
                      {key === 'sprinterDelivery' && 'Sprinter Delivery'}
                      {key === 'tanggalRekap' && 'Tanggal Rekap'}
                      {key === 'jumlahKoli' && 'Jumlah Koli'}
                      {key === 'jumlahPembayaranCOD' && 'Jumlah Pembayaran COD'}
                      {key === 'biayaDFOD' && 'Biaya DFOD'}
                    </label>
                    <select
                      value={columnMapping[key as keyof typeof columnMapping] ?? ''}
                      onChange={(e) => {
                        const newMapping = { ...columnMapping };
                        if (e.target.value === '') {
                          delete newMapping[key as keyof typeof columnMapping];
                        } else {
                          newMapping[key as keyof typeof columnMapping] = Number(e.target.value);
                        }
                        setColumnMapping(newMapping);
                      }}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {excelHeaders.map((header, idx) => (
                        <option key={idx} value={idx}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Preview Data (menampilkan 10 baris pertama dari {rawExcelData.length} total baris):</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-white border-b border-slate-200">
                      <tr>
                        {excelHeaders.map((header, idx) => (
                          <th key={idx} className="px-2 py-2 text-left text-slate-600 font-semibold whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {rawExcelData.slice(0, 10).map((row, ridx) => (
                        <tr key={ridx}>
                          {excelHeaders.map((header, hidx) => (
                            <td key={hidx} className="px-2 py-2 text-slate-600 truncate max-w-xs">
                              {String(row[header] || '').substring(0, 50)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button type="button" onClick={() => setShowColumnSelector(false)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
              <button type="button" onClick={handleProcessImport} className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700">Lanjutkan Import</button>
            </div>
          </div>
        </div>
      )}

      {importPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 px-4 py-6">
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Preview Import Excel</h3>
                <p className="mt-1 text-sm text-slate-500">File: {importFileName} · {importPreviewRows.length} baris siap diimpor.</p>
              </div>
              <button type="button" onClick={() => { setImportPreviewOpen(false); setImportPreviewRows([]); setImportFileName(''); }} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Tutup</button>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Waybill</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Sprinter</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Koli</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">COD</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">DFOD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {importPreviewRows.map((row, index) => (
                    <tr key={`${row.waybill}-${index}`} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{row.tanggalRekap}</td>
                      <td className="px-4 py-3 text-slate-700">{row.waybill}</td>
                      <td className="px-4 py-3 text-slate-700">{row.sprinterDelivery}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{row.jumlahKoli}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.jumlahPembayaranCOD)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.biayaDFOD)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button type="button" onClick={() => { setImportPreviewOpen(false); setImportPreviewRows([]); setImportFileName(''); }} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
              <button type="button" onClick={handleImportSubmit} disabled={importLoading} className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">{importLoading ? 'Menyimpan...' : 'Impor Data'}</button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Export Rekapan Internal Harian</h3>
                  <p className="mt-1 text-sm text-slate-500">Pilih tanggal awal dan akhir, tampilkan preview, lalu download file Excel.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportModal(false);
                    setExportPreviewOpen(false);
                    setExportPreviewRows([]);
                    setExportStartDate('');
                    setExportEndDate('');
                    setExportPeriodLabel('');
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

            {!exportPreviewOpen ? (
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Pilih Rentang Tanggal</p>
                  <p className="mt-2 text-sm text-slate-500">Gunakan tanggal awal dan akhir untuk menentukan periode data yang ingin diekspor.</p>
                  
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                      <span>Tanggal Awal</span>
                      <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                      <span>Tanggal Akhir</span>
                      <input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    Periode: <span className="font-semibold text-slate-900">{exportStartDate && exportEndDate ? computePeriodLabel(exportStartDate, exportEndDate) : 'Belum dipilih'}</span>
                  </p>

                  <button
                    type="button"
                    onClick={handleLoadExportPreview}
                    disabled={exportPreviewLoading}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                  >
                    {exportPreviewLoading ? 'Memuat preview...' : 'Tampilkan Preview'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                  <div className="mb-6 rounded-3xl bg-slate-50 p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Ringkasan</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="rounded-3xl bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Periode Ekspor</p>
                        <p className="mt-2 font-semibold text-slate-900">{exportPeriodLabel}</p>
                      </div>
                      <div className="rounded-3xl bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Baris</p>
                        <p className="mt-2 font-semibold text-slate-900">{exportPreviewRows.length}</p>
                      </div>
                    </div>
                  </div>

                  {exportPreviewRows.length > 0 && (
                    <div className="overflow-hidden rounded-3xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">No</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Waybill</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Sprinter Delivery</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Koli</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">COD</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">DFOD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {exportPreviewRows.slice(0, 10).map((row, index) => (
                            <tr key={`${row.waybill}-${index}`} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{index + 1}</td>
                              <td className="px-4 py-3 text-slate-700">{row.tanggalRekap}</td>
                              <td className="px-4 py-3 text-slate-700">{row.waybill}</td>
                              <td className="px-4 py-3 text-slate-700">{row.sprinterDelivery}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{row.jumlahKoli}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.jumlahPembayaranCOD)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.biayaDFOD)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {exportPreviewRows.length > 10 && (
                        <div className="p-4 text-sm text-slate-500">Menampilkan 10 dari {exportPreviewRows.length} baris.</div>
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
                      setExportStartDate('');
                      setExportEndDate('');
                      setExportPeriodLabel('');
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exportLoading || exportPreviewRows.length === 0}
                    className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                  >
                    {exportLoading ? 'Menyiapkan...' : 'Download Excel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
