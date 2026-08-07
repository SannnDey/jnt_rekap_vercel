'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useToast } from '@/components/ToastProvider';
import {
  AttendanceRecord,
  AttendanceStatus,
  DriverAttendanceStatus,
  ScheduleAttendanceApi,
  ScheduleEmployee,
} from '@/types';
import { computeExportMonthLabel } from '@/lib/utils';
import {
  useCreateScheduleAttendance,
  useCreateScheduleEmployee,
  useDeleteScheduleAttendance,
  useScheduleAttendances,
  useScheduleEmployees,
  useUpdateScheduleAttendance,
} from '@/hooks/useSchedule';

const adminStatuses: AttendanceStatus[] = ['Hadir', 'Sakit', 'Izin', 'Alpha'];
const driverStatuses: DriverAttendanceStatus[] = [
  'Hadir',
  'Sakit',
  'Izin',
  'Alpha',
  'Full GW + Deliv',
  'Full GW No Deliv',
  'GW Setengah',
];

const statusStyle: Record<string, string> = {
  Hadir: 'bg-emerald-100 text-emerald-700',
  Sakit: 'bg-amber-100 text-amber-700',
  Izin: 'bg-sky-100 text-sky-700',
  Alpha: 'bg-rose-100 text-rose-700',
  'Full GW + Deliv': 'bg-cyan-100 text-cyan-700',
  'Full GW No Deliv': 'bg-slate-100 text-slate-800',
  'GW Setengah': 'bg-violet-100 text-violet-700',
};

const mapAttendanceRecord = (attendance: ScheduleAttendanceApi): AttendanceRecord => ({
  id: attendance.id,
  tanggal: attendance.tanggal.slice(0, 10),
  employeeId: attendance.employeeId,
  employeeName: attendance.employee.name,
  role: attendance.employee.role,
  kehadiran: attendance.attendanceStatus as DriverAttendanceStatus,
  keterangan: attendance.keterangan ?? undefined,
  partnerId: attendance.partnerId ?? undefined,
  partnerName: attendance.partner?.name ?? undefined,
  createdAt: attendance.createdAt,
});

export default function RekapanSchedulePage() {
  const { toast } = useToast();
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState('');
  const [kehadiran, setKehadiran] = useState<DriverAttendanceStatus>('Hadir');
  const [keterangan, setKeterangan] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<'Admin' | 'Driver'>('Admin');
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditValues, setInlineEditValues] = useState<{
    tanggal: string;
    attendanceStatus: DriverAttendanceStatus;
    keterangan: string;
    partnerId: string;
  }>({
    tanggal: new Date().toISOString().slice(0, 10),
    attendanceStatus: 'Hadir',
    keterangan: '',
    partnerId: '',
  });
  const [exportLoading, setExportLoading] = useState(false);

  const { data: employees = [] } = useScheduleEmployees();
  const { data: attendances = [] } = useScheduleAttendances();
  const createAttendance = useCreateScheduleAttendance();
  const updateAttendance = useUpdateScheduleAttendance();
  const deleteAttendance = useDeleteScheduleAttendance();
  const createEmployee = useCreateScheduleEmployee();

  useEffect(() => {
    if (!employeeId && employees.length > 0) {
      setEmployeeId(employees[0].id);
    }
  }, [employees, employeeId]);

  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === employeeId) ?? employees[0],
    [employees, employeeId]
  );

  const driverPartners = useMemo(
    () => employees.filter((item) => item.role === 'Driver' && item.id !== selectedEmployee?.id),
    [employees, selectedEmployee?.id]
  );

  const adminEmployees = useMemo(() => employees.filter((item) => item.role === 'Admin'), [employees]);
  const driverEmployees = useMemo(() => employees.filter((item) => item.role === 'Driver'), [employees]);

  const attendanceRecords = useMemo(
    () => attendances.map(mapAttendanceRecord),
    [attendances]
  );

  const adminRecords = attendanceRecords.filter((record) => record.role === 'Admin');
  const driverRecords = attendanceRecords.filter((record) => record.role === 'Driver');
  const totalRecords = attendanceRecords.length;

  const handleEmployeeChange = (value: string) => {
    const nextEmployee = employees.find((item) => item.id === value);
    setEmployeeId(value);
    setKeterangan('');
    if (nextEmployee?.role === 'Driver') {
      setKehadiran('Hadir');
      setPartnerId(driverPartners[0]?.id ?? '');
    } else {
      setKehadiran('Hadir');
      setPartnerId('');
    }
  };

  const canSaveRecord = (): boolean => {
    if (!tanggal || !selectedEmployee) return false;
    if (kehadiran === 'GW Setengah' && !partnerId) return false;
    return true;
  };

  const handleCreateEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = newEmployeeName.trim();

    if (!trimmedName) {
      toast('Nama karyawan harus diisi.', 'error');
      return;
    }

    createEmployee.mutate(
      { name: trimmedName, role: newEmployeeRole },
      {
        onSuccess: (response) => {
          const createdEmployee = response?.data;
          toast(`Karyawan ${createdEmployee?.name ?? trimmedName} berhasil ditambahkan.`, 'success');
          setNewEmployeeName('');
          setNewEmployeeRole('Admin');
          if (createdEmployee?.id) {
            setEmployeeId(createdEmployee.id);
          }
        },
        onError: () => {
          toast('Gagal menambahkan karyawan. Periksa kembali data yang dikirim.', 'error');
        },
      }
    );
  };

  const resetAttendanceForm = () => {
    setTanggal(new Date().toISOString().slice(0, 10));
    setEmployeeId(employees[0]?.id ?? '');
    setKehadiran('Hadir');
    setKeterangan('');
    setPartnerId('');
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    setInlineEditingId(record.id);
    setInlineEditValues({
      tanggal: record.tanggal,
      attendanceStatus: record.kehadiran,
      keterangan: record.keterangan ?? '',
      partnerId: record.partnerId ?? '',
    });
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineEditValues({
      tanggal: new Date().toISOString().slice(0, 10),
      attendanceStatus: 'Hadir',
      keterangan: '',
      partnerId: '',
    });
  };

  const handleDeleteAttendance = (id: string) => {
    const confirmed = window.confirm('Hapus rekap kehadiran ini?');
    if (!confirmed) return;

    deleteAttendance.mutate(id, {
      onSuccess: () => {
        toast('Rekap kehadiran berhasil dihapus.', 'success');
        if (inlineEditingId === id) {
          handleCancelInlineEdit();
        }
      },
      onError: () => {
        toast('Gagal menghapus rekap kehadiran.', 'error');
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSaveRecord() || !selectedEmployee) {
      toast('Lengkapi data karyawan dan pilih partner driver saat GW Setengah.', 'error');
      return;
    }

    createAttendance.mutate(
      {
        tanggal,
        employeeId: selectedEmployee.id,
        attendanceStatus: kehadiran,
        keterangan: keterangan.trim() || undefined,
        partnerId: kehadiran === 'GW Setengah' ? partnerId : undefined,
      },
      {
        onSuccess: () => {
          toast(`Rekap kehadiran ${selectedEmployee.name} berhasil disimpan.`, 'success');
          resetAttendanceForm();
        },
        onError: () => {
          toast('Gagal menyimpan rekap kehadiran. Periksa kembali input atau jaringan.', 'error');
        },
      }
    );
  };

  const handleInlineSave = (record: AttendanceRecord) => {
    const payload = {
      tanggal: inlineEditValues.tanggal,
      employeeId: record.employeeId,
      attendanceStatus: inlineEditValues.attendanceStatus,
      keterangan: inlineEditValues.keterangan.trim() || undefined,
      partnerId: record.role === 'Driver' && inlineEditValues.attendanceStatus === 'GW Setengah' ? inlineEditValues.partnerId || undefined : undefined,
    };

    updateAttendance.mutate(
      { id: record.id, data: payload },
      {
        onSuccess: () => {
          toast(`Rekap kehadiran ${record.employeeName} berhasil diperbarui.`, 'success');
          handleCancelInlineEdit();
        },
        onError: () => {
          toast('Gagal memperbarui rekap kehadiran.', 'error');
        },
      }
    );
  };

  const downloadExcel = async () => {
    if (attendanceRecords.length === 0) {
      toast('Tidak ada data kehadiran untuk diekspor.', 'error');
      return;
    }

    setExportLoading(true);
    try {
      const ExcelJS = (await import('exceljs')) as any;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rekap Schedule');

      worksheet.columns = [
        { header: 'Tanggal', key: 'tanggal', width: 14 },
        { header: 'Nama', key: 'employeeName', width: 22 },
        { header: 'Jabatan', key: 'role', width: 14 },
        { header: 'Kehadiran', key: 'kehadiran', width: 22 },
        { header: 'Keterangan', key: 'keterangan', width: 32 },
        { header: 'Partner Driver', key: 'partnerName', width: 22 },
      ];

      worksheet.addRow(['REKAP SCHEDULE KARYAWAN']);
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.addRow([]);
      worksheet.addRow(['Total Rekap', totalRecords]);
      worksheet.addRow(['Admin', adminRecords.length]);
      worksheet.addRow(['Driver', driverRecords.length]);
      worksheet.addRow([]);
      worksheet.addRow([]);

      worksheet.getRow(6).font = { bold: true };
      attendanceRecords.forEach((record) => {
        worksheet.addRow({
          tanggal: record.tanggal,
          employeeName: record.employeeName,
          role: record.role,
          kehadiran: record.kehadiran,
          keterangan: record.keterangan || '',
          partnerName: record.partnerName || '',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `rekapan_schedule_${computeExportMonthLabel(new Date().toISOString().slice(0, 7)).replace(/\s+/g, '_')}.xlsx`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast('Export Excel Rekap Schedule berhasil disiapkan.', 'success');
    } catch (error) {
      toast('Gagal membuat file Excel. Coba lagi.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Header
        title="Rekapan Schedule"
        subtitle="Rekap Kehadiran Admin & Driver"
        description="Masukkan rekap kehadiran karyawan lalu ekspor hasilnya ke Excel dengan format yang mudah dibaca."
        right={
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Beranda
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 lg:px-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm">
          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr] xl:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Data Karyawan</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Rekapan Schedule</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Rekap kehadiran akan disimpan di halaman ini. Pilih nama karyawan, tanggal, dan status kehadiran sesuai masing-masing peran.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{adminEmployees.length}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {adminEmployees.length > 0
                    ? `${adminEmployees.map((employee) => employee.name).join(', ')} tersedia sebagai admin.`
                    : 'Belum ada admin terdaftar.'}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Driver</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{driverEmployees.length}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {driverEmployees.length > 0
                    ? `${driverEmployees.map((employee) => employee.name).join(', ')} tersedia sebagai driver.`
                    : 'Belum ada driver terdaftar.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Form Tambah Karyawan</h2>
              <p className="mt-2 text-sm text-slate-600">Tambahkan karyawan baru sebelum mengisi rekap kehadiran.</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleCreateEmployee}>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Nama Karyawan</label>
              <input
                type="text"
                value={newEmployeeName}
                onChange={(event) => setNewEmployeeName(event.target.value)}
                placeholder="Contoh: Budi"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Jabatan</label>
              <select
                value={newEmployeeRole}
                onChange={(event) => setNewEmployeeRole(event.target.value as 'Admin' | 'Driver')}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
              >
                <option value="Admin">Admin</option>
                <option value="Driver">Driver</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {createEmployee.isPending ? 'Menyimpan...' : 'Tambah Karyawan'}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Form Input Kehadiran</h2>
              <p className="mt-2 text-sm text-slate-600">Isi data kehadiran, lalu klik simpan untuk menambahkan ke tabel rekap.</p>
            </div>
            <button
              type="button"
              onClick={downloadExcel}
              disabled={exportLoading}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {exportLoading ? 'Membuat Excel...' : 'Export ke Excel'}
            </button>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(event) => setTanggal(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Nama Karyawan</label>
                <select
                  value={employeeId}
                  onChange={(event) => handleEmployeeChange(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} — {employee.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Kehadiran</label>
                <select
                  value={kehadiran}
                  onChange={(event) => setKehadiran(event.target.value as DriverAttendanceStatus)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                >
                  {(selectedEmployee?.role === 'Admin' ? adminStatuses : driverStatuses).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee?.role === 'Driver' && kehadiran === 'GW Setengah' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Setengah Bersama</label>
                  <select
                    value={partnerId}
                    onChange={(event) => setPartnerId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                  >
                    <option value="">Pilih driver lain</option>
                    {driverPartners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                  {driverPartners.length === 0 && (
                    <p className="mt-2 text-sm text-rose-600">Belum ada driver lain yang tersedia untuk GW Setengah.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700">Keterangan</label>
                <textarea
                  value={keterangan}
                  onChange={(event) => setKeterangan(event.target.value)}
                  rows={3}
                  placeholder={kehadiran === 'Alpha' ? 'Tidak perlu keterangan untuk alpha' : 'Tambahkan keterangan jika diperlukan'}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-700">Petunjuk</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>Masukkan tanggal dan pilih karyawan yang tersedia.</li>
                    <li>Admin: hadir, sakit, izin, alpha.</li>
                    <li>Driver: hadir, sakit, izin, alpha, full GW + deliv, full GW no deliv, GW setengah.</li>
                    <li>Untuk GW Setengah, pilih partner driver yang ikut setengah tugas.</li>
                  </ul>
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Simpan Rekap Kehadiran
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Daftar Rekap Kehadiran</h2>
              <p className="mt-2 text-sm text-slate-600">Rekap kehadiran dipisah berdasarkan peran Admin dan Driver.</p>
            </div>
            <div className="inline-flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Total: {totalRecords}</span>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm text-emerald-700">Admin: {adminRecords.length}</span>
              <span className="rounded-full bg-cyan-100 px-4 py-2 text-sm text-cyan-700">Driver: {driverRecords.length}</span>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
              <div className="bg-emerald-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-emerald-800">Admin</h3>
              </div>
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-900">
                  <tr>
                    <th className="px-6 py-4 font-semibold">No</th>
                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-6 py-4 font-semibold">Nama</th>
                    <th className="px-6 py-4 font-semibold">Kehadiran</th>
                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                    <th className="px-6 py-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {adminRecords.map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                      <td className="px-6 py-4 font-medium text-slate-900">{index + 1}</td>
                      {inlineEditingId === record.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="date"
                              value={inlineEditValues.tanggal}
                              onChange={(event) => setInlineEditValues((current) => ({ ...current, tanggal: event.target.value }))}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            />
                          </td>
                          <td className="px-6 py-4">{record.employeeName}</td>
                          <td className="px-6 py-4">
                            <select
                              value={inlineEditValues.attendanceStatus}
                              onChange={(event) => setInlineEditValues((current) => ({ ...current, attendanceStatus: event.target.value as DriverAttendanceStatus }))}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            >
                              {adminStatuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <textarea
                              rows={2}
                              value={inlineEditValues.keterangan}
                              onChange={(event) => setInlineEditValues((current) => ({ ...current, keterangan: event.target.value }))}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleInlineSave(record)}
                                className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelInlineEdit}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Batal
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">{record.tanggal}</td>
                          <td className="px-6 py-4">{record.employeeName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[record.kehadiran]}`}>{record.kehadiran}</span>
                          </td>
                          <td className="px-6 py-4">{record.keterangan || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditAttendance(record)}
                                className="rounded-full border border-sky-300 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttendance(record.id)}
                                className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {adminRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                        Belum ada data Admin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
              <div className="bg-cyan-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-cyan-800">Driver</h3>
              </div>
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-900">
                  <tr>
                    <th className="px-6 py-4 font-semibold">No</th>
                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-6 py-4 font-semibold">Nama</th>
                    <th className="px-6 py-4 font-semibold">Kehadiran</th>
                    <th className="px-6 py-4 font-semibold">Partner</th>
                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                    <th className="px-6 py-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {driverRecords.map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                      <td className="px-6 py-4 font-medium text-slate-900">{index + 1}</td>
                      {inlineEditingId === record.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="date"
                              value={inlineEditValues.tanggal}
                              onChange={(event) => setInlineEditValues((current) => ({ ...current, tanggal: event.target.value }))}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            />
                          </td>
                          <td className="px-6 py-4">{record.employeeName}</td>
                          <td className="px-6 py-4">
                            <select
                              value={inlineEditValues.attendanceStatus}
                              onChange={(event) => setInlineEditValues((current) => ({ ...current, attendanceStatus: event.target.value as DriverAttendanceStatus }))}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            >
                              {driverStatuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={inlineEditValues.partnerId}
                              onChange={(event) => setInlineEditValues((current) => ({ ...current, partnerId: event.target.value }))}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            >
                              <option value="">Pilih partner</option>
                              {employees.filter((employee) => employee.role === 'Driver' && employee.id !== record.employeeId).map((employee) => (
                                <option key={employee.id} value={employee.id}>{employee.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <textarea
                              rows={2}
                              value={inlineEditValues.keterangan}
                              onChange={(event) => setInlineEditValues((current) => ({ ...current, keterangan: event.target.value }))}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleInlineSave(record)}
                                className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelInlineEdit}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Batal
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">{record.tanggal}</td>
                          <td className="px-6 py-4">{record.employeeName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[record.kehadiran]}`}>{record.kehadiran}</span>
                          </td>
                          <td className="px-6 py-4">{record.partnerName || '-'}</td>
                          <td className="px-6 py-4">{record.keterangan || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditAttendance(record)}
                                className="rounded-full border border-sky-300 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttendance(record.id)}
                                className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {driverRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                        Belum ada data Driver.
                      </td>
                    </tr>
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
