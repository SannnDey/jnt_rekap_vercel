'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { usePayrollRate, useUpsertPayrollRate, usePayrollHistory, useSavePayrollHistory } from '@/hooks/usePayrollRates';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';

const DEFAULT_PAYROLL_RATES = {
  adminBase: 90000,
  driverBase: 80000,
  makan: 10000,
  awb: 1000,
  gw: 20000,
};

export default function RekapanGajiAdminPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [rates, setRates] = useState(DEFAULT_PAYROLL_RATES);

  const { toast } = useToast();
  const { data: payrollRate, isLoading: payrollRateLoading } = usePayrollRate(selectedMonth);
  const upsertPayrollRate = useUpsertPayrollRate();
  const { data: history = [], isLoading: historyLoading } = usePayrollHistory(selectedMonth);
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
    }
  }, [payrollRate]);

  const handleRateChange = (field: keyof typeof rates, value: number) => {
    setRates((current) => ({ ...current, [field]: Number.isNaN(value) ? 0 : value }));
  };

  const saveRates = async () => {
    try {
      await upsertPayrollRate.mutateAsync({ month: selectedMonth, data: rates });
      toast('Tarif payroll berhasil disimpan.', 'success');
    } catch {
      toast('Gagal menyimpan tarif payroll.', 'error');
    }
  };

  const saveHistory = async () => {
    if (history.length === 0) {
      toast('Tidak ada riwayat payroll untuk disimpan.', 'error');
      return;
    }

    try {
      const rows = history.map((item) => ({
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        role: item.role,
        hadirCount: item.hadirCount,
        basePay: item.basePay,
        makanPay: item.makanPay,
        bonusManual: item.bonusManual,
        awbBonus: item.awbBonus,
        gwBonus: item.gwBonus,
        bonusTotal: item.bonusTotal,
        kasbonAmount: item.kasbonAmount,
        grossPay: item.grossPay,
        netPay: item.netPay,
      }));
      await savePayrollHistory.mutateAsync({ month: selectedMonth, rows });
      toast('Riwayat payroll berhasil disimpan.', 'success');
    } catch {
      toast('Gagal menyimpan riwayat payroll.', 'error');
    }
  };

  const adminHistory = history.filter((row) => row.role === 'Admin');
  const driverHistory = history.filter((row) => row.role === 'Driver');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Header
        title="Admin Rekapan Gaji"
        subtitle="Kelola tarif dan riwayat gaji Admin / Driver"
        description="Simpan tarif payroll per bulan dan lihat history gaji terstruktur untuk setiap peran."
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
            href="/rekapan-gaji"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            Ke Halaman Rekap Gaji
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Periode</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">{selectedMonth}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(200px,1fr)_auto]">
                <label className="block text-sm font-semibold text-slate-300">
                  Pilih Bulan
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveRates}
                  disabled={upsertPayrollRate.status === 'pending' || payrollRateLoading}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {upsertPayrollRate.status === 'pending' ? 'Menyimpan...' : 'Simpan Tarif'}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(
                [
                  { label: 'Gaji Pokok Admin / hadir', field: 'adminBase' as const },
                  { label: 'Gaji Pokok Driver / hadir', field: 'driverBase' as const },
                  { label: 'Uang Makan / hadir', field: 'makan' as const },
                  { label: 'Bonus AWB / koli', field: 'awb' as const },
                  { label: 'Bonus GW / kehadiran', field: 'gw' as const },
                ] as const
              ).map(({ label, field }) => (
                <label key={field} className="block rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
                  <span className="text-sm text-slate-300">{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={rates[field]}
                    onChange={(event) => handleRateChange(field, Number(event.target.value))}
                    className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-right text-slate-100 outline-none focus:border-sky-400"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Status Penyimpanan</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {payrollRate ? 'Tarif tersimpan' : 'Belum ada tarif'}
                </p>
              </div>
              <button
                type="button"
                onClick={saveHistory}
                disabled={savePayrollHistory.status === 'pending' || history.length === 0}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savePayrollHistory.status === 'pending' ? 'Menyimpan...' : 'Simpan Riwayat'}
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <p>Bulan ini menyimpan tarif dinamis ke tabel payroll_rate.</p>
              <p>Riwayat gaji dapat direkam ke tabel payroll_history untuk audit dan export.</p>
              <p>Gunakan halaman utama Rekap Gaji untuk melihat dan mengekspor data admin/driver secara terpisah.</p>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Riwayat Payroll</h2>
              <p className="mt-2 text-sm text-slate-400">Lihat data payroll per bulan dengan pemisahan Admin / Driver.</p>
            </div>
            <p className="rounded-full bg-slate-950/80 px-4 py-2 text-sm text-slate-300">{selectedMonth}</p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="px-4 py-4 font-semibold">Nama</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Hadir</th>
                  <th className="px-4 py-4 font-semibold">Gaji Pokok</th>
                  <th className="px-4 py-4 font-semibold">Uang Makan</th>
                  <th className="px-4 py-4 font-semibold">Bonus Manual</th>
                  <th className="px-4 py-4 font-semibold">Bonus AWB</th>
                  <th className="px-4 py-4 font-semibold">Bonus GW</th>
                  <th className="px-4 py-4 font-semibold">Kasbon</th>
                  <th className="px-4 py-4 font-semibold">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-950/40">
                {historyLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">Memuat riwayat payroll...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">Riwayat payroll kosong untuk bulan ini.</td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id} className="border-t border-slate-800">
                      <td className="px-4 py-4">{row.employeeName}</td>
                      <td className="px-4 py-4">{row.role}</td>
                      <td className="px-4 py-4">{row.hadirCount}</td>
                      <td className="px-4 py-4">{formatCurrency(row.basePay)}</td>
                      <td className="px-4 py-4">{formatCurrency(row.makanPay)}</td>
                      <td className="px-4 py-4">{formatCurrency(row.bonusManual)}</td>
                      <td className="px-4 py-4">{formatCurrency(row.awbBonus)}</td>
                      <td className="px-4 py-4">{formatCurrency(row.gwBonus)}</td>
                      <td className="px-4 py-4">{formatCurrency(row.kasbonAmount)}</td>
                      <td className="px-4 py-4 font-semibold text-white">{formatCurrency(row.netPay)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
              <p className="text-sm text-slate-400">Total Admin</p>
              <p className="mt-2 text-2xl font-semibold text-white">{adminHistory.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
              <p className="text-sm text-slate-400">Total Driver</p>
              <p className="mt-2 text-2xl font-semibold text-white">{driverHistory.length}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
