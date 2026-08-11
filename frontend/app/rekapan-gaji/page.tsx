'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { apiClient } from '@/lib/api';
import { useKasbonSummary } from '@/hooks/useKasbon';
import { useScheduleAttendances, useScheduleEmployees } from '@/hooks/useSchedule';
import { usePayrollRate, useUpsertPayrollRate, usePayrollHistory, useSavePayrollHistory } from '@/hooks/usePayrollRates';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency, getMonthRange } from '@/lib/utils';
import { RekapanInternalSummary } from '@/types/internal';
import { ScheduleAttendanceApi, ScheduleEmployee } from '@/types';

const DEFAULT_PAYROLL_RATES = {
  adminBase: 90000,
  driverBase: 80000,
  makan: 10000,
  awb: 1000,
  gw: 20000,
};

const driverPresenceStatuses = ['Hadir', 'Full GW + Deliv', 'Full GW No Deliv', 'GW Setengah'];

const EMPLOYEE_NAME_ALIASES: Record<string, string> = {
  'Freelance 1': 'Jheman',
};

const normalizeEmployeeName = (name: string) => EMPLOYEE_NAME_ALIASES[name] ?? name;

interface PayrollRates {
  adminBase: number;
  driverBase: number;
  makan: number;
  awb: number;
  gw: number;
}

interface PayrollRow {
  id: string;
  name: string;
  role: 'Admin' | 'Driver';
  hadirCount: number;
  basePay: number;
  makanPay: number;
  bonusManual: number;
  awbBonus: number;
  gwBonus: number;
  bonusTotal: number;
  kasbonAmount: number;
  grossPay: number;
  netPay: number;
  fullGwCount: number;
  totalKoli: number;
}

const buildPayrollRow = (
  employee: ScheduleEmployee,
  attendances: ScheduleAttendanceApi[],
  kasbonSummary: any,
  internalSummary: RekapanInternalSummary | undefined,
  rates: PayrollRates,
  manualBonus: number
): PayrollRow => {
  const employeeAttendances = attendances.filter((attendance) => attendance.employeeId === employee.id);
  const hadirCount = employeeAttendances.filter((attendance) => {
    if (employee.role === 'Admin') return attendance.attendanceStatus === 'Hadir';
    return driverPresenceStatuses.includes(attendance.attendanceStatus);
  }).length;

  const fullGwCount = employeeAttendances.filter((attendance) =>
    ['Full GW + Deliv', 'Full GW No Deliv', 'GW Setengah'].includes(attendance.attendanceStatus)
  ).length;

  const normalizedEmployeeName = normalizeEmployeeName(employee.name);
  const totalKoli = internalSummary?.bySprinter.find((item) => normalizeEmployeeName(item.sprinterDelivery) === normalizedEmployeeName)?.totalKoli || 0;
  const kasbonAmount = kasbonSummary?.byEmployee?.find((item: any) => normalizeEmployeeName(item.employee) === normalizedEmployeeName)?.totalAmount || 0;

  const basePay = employee.role === 'Admin' ? hadirCount * rates.adminBase : hadirCount * rates.driverBase;
  const makanPay = hadirCount * rates.makan;
  const awbBonus = employee.role === 'Driver' ? totalKoli * rates.awb : 0;
  const gwBonus = employee.role === 'Driver' ? fullGwCount * rates.gw : 0;
  const bonusTotal = employee.role === 'Driver' ? awbBonus + gwBonus + manualBonus : manualBonus;
  const grossPay = basePay + makanPay + bonusTotal;
  const netPay = grossPay - kasbonAmount;

  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    hadirCount,
    basePay,
    makanPay,
    bonusManual: manualBonus,
    awbBonus,
    gwBonus,
    bonusTotal,
    kasbonAmount,
    grossPay,
    netPay,
    fullGwCount,
    totalKoli,
  };
};

export default function RekapanGajiPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [rates, setRates] = useState<PayrollRates>(DEFAULT_PAYROLL_RATES);
  const [manualBonuses, setManualBonuses] = useState<Record<string, number>>({});

  const periodRange = getMonthRange(selectedMonth);
  const startDate = periodRange?.startDate;
  const endDate = periodRange?.endDate;

  const { data: employees = [] } = useScheduleEmployees();
  const { data: attendances = [] } = useScheduleAttendances(undefined, undefined, startDate, endDate);
  const { data: kasbonResp } = useKasbonSummary(startDate, endDate);
  const kasbonSummary = kasbonResp?.data;

  const [internalSummary, setInternalSummary] = useState<RekapanInternalSummary>({
    totalAwb: 0,
    totalKoli: 0,
    totalCOD: 0,
    totalDFOD: 0,
    bySprinter: [],
  });

  useEffect(() => {
    const loadInternalSummary = async () => {
      if (!startDate || !endDate) return;
      try {
        const response = await apiClient.getRekapanInternalSummary(startDate, endDate);
        if (response?.data) {
          setInternalSummary(response.data);
        }
      } catch {
        setInternalSummary({
          totalAwb: 0,
          totalKoli: 0,
          totalCOD: 0,
          totalDFOD: 0,
          bySprinter: [],
        });
      }
    };

    loadInternalSummary();
  }, [startDate, endDate]);

  const { toast } = useToast();
  const { data: payrollRate, isLoading: payrollRateLoading } = usePayrollRate(selectedMonth);
  const upsertPayrollRate = useUpsertPayrollRate();
  const { data: payrollHistory = [] } = usePayrollHistory(selectedMonth);
  const savePayrollHistory = useSavePayrollHistory();

  useEffect(() => {
    if (payrollRate) {
      setRates({
        adminBase: payrollRate.adminBase,
        driverBase: payrollRate.driverBase,
        makan: payrollRate.makan,
        awb: payrollRate.awb,
        gw: payrollRate.gw,
      });
    } else {
      setRates(DEFAULT_PAYROLL_RATES);
    }
  }, [payrollRate]);

  const payrollRows = useMemo(() => {
    const rows = employees.map((employee) =>
      buildPayrollRow(employee, attendances, kasbonSummary, internalSummary, rates, manualBonuses[employee.id] || 0)
    );
    if (!selectedEmployeeId) return rows;
    return rows.filter((row) => row.id === selectedEmployeeId);
  }, [employees, attendances, kasbonSummary, internalSummary, rates, manualBonuses, selectedEmployeeId]);

  const adminRows = payrollRows.filter((row) => row.role === 'Admin');
  const driverRows = payrollRows.filter((row) => row.role === 'Driver');

  const totals = payrollRows.reduce(
    (acc, row) => {
      acc.basePay += row.basePay;
      acc.makanPay += row.makanPay;
      acc.bonusTotal += row.bonusTotal;
      acc.kasbonAmount += row.kasbonAmount;
      acc.grossPay += row.grossPay;
      acc.netPay += row.netPay;
      return acc;
    },
    { basePay: 0, makanPay: 0, bonusTotal: 0, kasbonAmount: 0, grossPay: 0, netPay: 0 }
  );

  const handleRateChange = (field: keyof PayrollRates, value: number) => {
    setRates((current) => ({ ...current, [field]: Number.isNaN(value) ? 0 : value }));
  };

  const handleManualBonusChange = (employeeId: string, value: number) => {
    setManualBonuses((current) => ({ ...current, [employeeId]: Number.isNaN(value) ? 0 : value }));
  };

  const handleSaveRates = async () => {
    try {
      await upsertPayrollRate.mutateAsync({ month: selectedMonth, data: rates });
      toast('Tarif payroll berhasil disimpan.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
      console.error('Payroll save error:', error);
      toast(`Gagal menyimpan tarif payroll: ${message}`, 'error');
    }
  };

  const handleSaveHistory = async () => {
    if (payrollRows.length === 0) {
      toast('Tidak ada data payroll untuk disimpan.', 'error');
      return;
    }

    try {
      await savePayrollHistory.mutateAsync({
        month: selectedMonth,
        rows: payrollRows.map((row) => ({
          employeeId: row.id,
          employeeName: row.name,
          role: row.role,
          hadirCount: row.hadirCount,
          basePay: row.basePay,
          makanPay: row.makanPay,
          bonusManual: row.bonusManual,
          awbBonus: row.awbBonus,
          gwBonus: row.gwBonus,
          bonusTotal: row.bonusTotal,
          kasbonAmount: row.kasbonAmount,
          grossPay: row.grossPay,
          netPay: row.netPay,
        })),
      });
      toast('Riwayat payroll berhasil disimpan.', 'success');
    } catch (error) {
      toast('Gagal menyimpan riwayat payroll.', 'error');
    }
  };

  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const ExcelJS = (await import('exceljs')) as any;
      const workbook = new ExcelJS.Workbook();
      const filterName = selectedEmployeeId ? employees.find((emp) => emp.id === selectedEmployeeId)?.name : 'Semua';

      const createPayrollSheet = (sheetName: string, rows: PayrollRow[], columns: any[]) => {
        const worksheet = workbook.addWorksheet(sheetName);
        worksheet.columns = columns;

        worksheet.addRow([`Rekap Gaji ${sheetName}`]);
        worksheet.addRow(['Periode', selectedMonth]);
        worksheet.addRow(['Filter Karyawan', filterName]);
        worksheet.addRow([]);

        const titleRow = worksheet.addRow(columns.map((column) => column.header));
        titleRow.eachCell((cell: any) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' },
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        rows.forEach((row) => {
          worksheet.addRow({
            name: row.name,
            hadirCount: row.hadirCount,
            basePay: row.basePay,
            makanPay: row.makanPay,
            bonusManual: row.bonusManual,
            awbBonus: row.awbBonus,
            gwBonus: row.gwBonus,
            kasbonAmount: row.kasbonAmount,
            netPay: row.netPay,
          });
        });

        const totalRow = worksheet.addRow([
          'Total',
          '',
          { formula: `SUM(C${titleRow.number + 1}:C${titleRow.number + rows.length})` },
          { formula: `SUM(D${titleRow.number + 1}:D${titleRow.number + rows.length})` },
          { formula: `SUM(E${titleRow.number + 1}:E${titleRow.number + rows.length})` },
          { formula: `SUM(F${titleRow.number + 1}:F${titleRow.number + rows.length})` },
          { formula: `SUM(G${titleRow.number + 1}:G${titleRow.number + rows.length})` },
          { formula: `SUM(H${titleRow.number + 1}:H${titleRow.number + rows.length})` },
          { formula: `SUM(I${titleRow.number + 1}:I${titleRow.number + rows.length})` },
        ]);

        totalRow.eachCell((cell: any) => {
          cell.font = { bold: true };
        });

        worksheet.views = [{ state: 'frozen', ySplit: 4 }];
        worksheet.properties.defaultRowHeight = 18;
        worksheet.eachRow({ includeEmpty: false }, (row: any) => {
          row.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        return worksheet;
      };

      const adminRows = payrollRows.filter((row) => row.role === 'Admin');
      const driverRows = payrollRows.filter((row) => row.role === 'Driver');

      createPayrollSheet('Admin', adminRows, [
        { header: 'Nama', key: 'name', width: 24 },
        { header: 'Hadir', key: 'hadirCount', width: 12 },
        { header: 'Gaji Pokok', key: 'basePay', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Uang Makan', key: 'makanPay', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Bonus Manual', key: 'bonusManual', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Kasbon', key: 'kasbonAmount', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Gaji Bersih', key: 'netPay', width: 18, style: { numFmt: '#,##0' } },
      ]);

      createPayrollSheet('Driver', driverRows, [
        { header: 'Nama', key: 'name', width: 24 },
        { header: 'Hadir', key: 'hadirCount', width: 12 },
        { header: 'Gaji Pokok', key: 'basePay', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Uang Makan', key: 'makanPay', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Bonus Manual', key: 'bonusManual', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Bonus AWB', key: 'awbBonus', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Bonus GW', key: 'gwBonus', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Kasbon', key: 'kasbonAmount', width: 16, style: { numFmt: '#,##0' } },
        { header: 'Gaji Bersih', key: 'netPay', width: 18, style: { numFmt: '#,##0' } },
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rekap_gaji_${selectedMonth}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Header
        title="Rekap Gaji"
        subtitle="Hitung gaji Admin dan Driver per bulan dari data kehadiran, internal, dan kasbon"
        description="Gunakan pengaturan dinamis untuk mengubah tarif gaji pokok, uang makan, bonus AWB, dan bonus GW."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Kembali ke Beranda
          </Link>
          <Link
            href="/rekapan-gaji-admin"
            className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-400 hover:bg-sky-500/20"
          >
            Ke Halaman Admin
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Periode Gaji</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">{selectedMonth}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto_auto] sm:items-end">
                <div>
                  <label className="block text-sm font-semibold text-slate-300">Pilih Bulan</label>
                  <input
                    type="month"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300">Filter Karyawan</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) => setSelectedEmployeeId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                  >
                    <option value="">Semua Karyawan</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(currentMonth);
                    setSelectedEmployeeId('');
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  Reset Filter
                </button>
                <button
                  type="button"
                  onClick={exportToExcel}
                  disabled={exportLoading}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exportLoading ? 'Mengekspor...' : 'Export Excel'}
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Tarif Dinamis</h3>
                    <p className="mt-2 text-xs text-slate-500">Tarif disimpan di server per bulan untuk halaman Rekap Gaji.</p>
                  </div>
                  <div className="inline-flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleSaveRates}
                      disabled={upsertPayrollRate.status === 'pending' || payrollRateLoading}
                      className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {upsertPayrollRate.status === 'pending' ? 'Menyimpan...' : 'Simpan Tarif'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveHistory}
                      disabled={savePayrollHistory.status === 'pending' || payrollRows.length === 0}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savePayrollHistory.status === 'pending' ? 'Menyimpan...' : 'Simpan Riwayat'}
                    </button>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {(
                    [
                      { label: 'Gaji Pokok Admin / hadir', field: 'adminBase' as const },
                      { label: 'Gaji Pokok Driver / hadir', field: 'driverBase' as const },
                      { label: 'Uang Makan / hadir', field: 'makan' as const },
                      { label: 'Bonus AWB / koli', field: 'awb' as const },
                      { label: 'Bonus GW / kehadiran', field: 'gw' as const },
                    ] as const
                  ).map(({ label, field }) => (
                    <div key={field} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
                      <div>
                        <p className="text-sm text-slate-300">{label}</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={rates[field]}
                        onChange={(event) => handleRateChange(field, Number(event.target.value))}
                        className="w-32 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-right text-slate-100 outline-none focus:border-sky-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Ringkasan Data</h3>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
                    <p className="text-sm text-slate-400">Total Karyawan</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{employees.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
                    <p className="text-sm text-slate-400">Total Kasbon</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(kasbonSummary?.totalAmount || 0)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
                    <p className="text-sm text-slate-400">Total AWB</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{internalSummary.totalAwb}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Total Gaji</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totals.netPay)}</p>
                <p className="mt-2 text-sm text-slate-400">Gaji bersih yang akan dibayarkan setelah kasbon.</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Total Bonus</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totals.bonusTotal)}</p>
                <p className="mt-2 text-sm text-slate-400">Termasuk bonus AWB, bonus GW, dan bonus manual.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Petunjuk</h3>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <p>1. Gaji pokok dan uang makan dihitung dari jumlah kehadiran sesuai tarif.</p>
              <p>2. Kasbon diambil dari data kasbon dan dikurangkan dari gaji kotor.</p>
              <p>3. Bonus AWB dihitung berdasarkan total koli per sprinter di data internal.</p>
              <p>4. Bonus GW dihitung dari jumlah kehadiran Full GW pada data schedule.</p>
              <p>5. Bonus manual Admin bisa diisi per baris untuk menyesuaikan gaji kotor.</p>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-10">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Rekap Gaji Admin</h2>
                <p className="mt-2 text-sm text-slate-400">Perhitungan gaji Admin berdasarkan kehadiran, bonus manual, dan kasbon.</p>
              </div>
              <p className="rounded-full bg-slate-950/80 px-4 py-2 text-sm text-slate-300">{selectedMonth}</p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Nama</th>
                    <th className="px-4 py-4 font-semibold">Hadir</th>
                    <th className="px-4 py-4 font-semibold">Gaji Pokok</th>
                    <th className="px-4 py-4 font-semibold">Uang Makan</th>
                    <th className="px-4 py-4 font-semibold">Bonus Manual</th>
                    <th className="px-4 py-4 font-semibold">Kasbon</th>
                    <th className="px-4 py-4 font-semibold">Gaji Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-950/40">
                  {adminRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">Tidak ada data Admin pada periode ini.</td>
                    </tr>
                  ) : (
                    adminRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-800">
                        <td className="px-4 py-4">{row.name}</td>
                        <td className="px-4 py-4">{row.hadirCount}</td>
                        <td className="px-4 py-4">{formatCurrency(row.basePay)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.makanPay)}</td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min={0}
                            value={row.bonusManual}
                            onChange={(event) => handleManualBonusChange(row.id, Number(event.target.value))}
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-right text-slate-100 outline-none focus:border-sky-400"
                          />
                        </td>
                        <td className="px-4 py-4">{formatCurrency(row.kasbonAmount)}</td>
                        <td className="px-4 py-4 font-semibold text-white">{formatCurrency(row.netPay)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Rekap Gaji Driver</h2>
                <p className="mt-2 text-sm text-slate-400">Penghitungan gaji Driver dengan bonus AWB dan bonus GW otomatis.</p>
              </div>
              <p className="rounded-full bg-slate-950/80 px-4 py-2 text-sm text-slate-300">{selectedMonth}</p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Nama</th>
                    <th className="px-4 py-4 font-semibold">Hadir</th>
                    <th className="px-4 py-4 font-semibold">Gaji Pokok</th>
                    <th className="px-4 py-4 font-semibold">Uang Makan</th>
                    <th className="px-4 py-4 font-semibold">Bonus AWB</th>
                    <th className="px-4 py-4 font-semibold">Bonus GW</th>
                    <th className="px-4 py-4 font-semibold">Bonus Manual</th>
                    <th className="px-4 py-4 font-semibold">Kasbon</th>
                    <th className="px-4 py-4 font-semibold">Gaji Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-950/40">
                  {driverRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">Tidak ada data Driver pada periode ini.</td>
                    </tr>
                  ) : (
                    driverRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-800">
                        <td className="px-4 py-4">{row.name}</td>
                        <td className="px-4 py-4">{row.hadirCount}</td>
                        <td className="px-4 py-4">{formatCurrency(row.basePay)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.makanPay)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.awbBonus)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.gwBonus)}</td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min={0}
                            value={row.bonusManual}
                            onChange={(event) => handleManualBonusChange(row.id, Number(event.target.value))}
                            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-right text-slate-100 outline-none focus:border-sky-400"
                          />
                        </td>
                        <td className="px-4 py-4">{formatCurrency(row.kasbonAmount)}</td>
                        <td className="px-4 py-4 font-semibold text-white">{formatCurrency(row.netPay)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
