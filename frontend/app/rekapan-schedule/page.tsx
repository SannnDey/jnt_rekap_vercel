'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { authService } from '@/lib/auth';

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

const driverPresenceStatuses: DriverAttendanceStatus[] = [
  'Hadir',
  'Full GW + Deliv',
  'Full GW No Deliv',
  'GW Setengah',
];

const partnerAllowedStatuses: DriverAttendanceStatus[] = [
  'Hadir',
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

const isDriverPresentStatus = (status: DriverAttendanceStatus) =>
  driverPresenceStatuses.includes(status);

const isAttendancePresent = (record: AttendanceRecord) =>
  record.role === 'Driver'
    ? isDriverPresentStatus(record.kehadiran)
    : record.kehadiran === 'Hadir';

export default function RekapanSchedulePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
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
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportPreviewLoading, setExportPreviewLoading] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState<AttendanceRecord[]>([]);
  const [exportSelectedMonth, setExportSelectedMonth] = useState('');
  const [exportPeriodLabel, setExportPeriodLabel] = useState('');

  const { data: employees = [] } = useScheduleEmployees();
  const { data: attendances = [] } = useScheduleAttendances();
  const createAttendance = useCreateScheduleAttendance();
  const updateAttendance = useUpdateScheduleAttendance();
  const deleteAttendance = useDeleteScheduleAttendance();
  const createEmployee = useCreateScheduleEmployee();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!['admin', 'driver'].includes(user.role)) {
      router.replace('/');
    }
  }, [router]);

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

  const totalEmployees = employees.length;
  const todayString = new Date().toISOString().slice(0, 10);
  const todaysAttendanceCount = useMemo(
    () => attendanceRecords.filter((record) => record.tanggal === todayString).length,
    [attendanceRecords, todayString]
  );
  const todaysPresentCount = useMemo(
    () => attendanceRecords.filter((record) => record.tanggal === todayString && isAttendancePresent(record)).length,
    [attendanceRecords, todayString]
  );

  const adminRecords = attendanceRecords.filter((record) => record.role === 'Admin');
  const driverRecords = attendanceRecords.filter((record) => record.role === 'Driver');
  const groupByDate = (records: AttendanceRecord[]) => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of records) {
      const key = r.tanggal;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  };
  const groupedAdmin = groupByDate(adminRecords);
  const groupedDriver = groupByDate(driverRecords);
  const driverPresentCount = useMemo(
    () => driverRecords.filter((record) => isDriverPresentStatus(record.kehadiran)).length,
    [driverRecords]
  );
  const totalRecords = attendanceRecords.length;
  const canExportData = currentUser?.role === 'admin';

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
    return true;
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

  const handleDeleteAttendance = (record: any) => {
    const confirmed = window.confirm('Hapus rekap kehadiran ini?');
    if (!confirmed) return;

    deleteAttendance.mutate(record.id, {
      onSuccess: () => {
        const itemLabel = `✅ ${record.employeeName}`;
        toast(`🗑️ ${itemLabel}`, 'success');
        if (inlineEditingId === record.id) {
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
      toast('Lengkapi data karyawan.', 'error');
      return;
    }

    createAttendance.mutate(
      {
        tanggal,
        employeeId: selectedEmployee.id,
        attendanceStatus: kehadiran,
        keterangan: keterangan.trim() || undefined,
        partnerId: partnerAllowedStatuses.includes(kehadiran) ? partnerId || undefined : undefined,
      },
      {
        onSuccess: () => {
          const itemLabel = `✅ ${selectedEmployee.name}`;
          toast(`✅ ${itemLabel}`, 'success');
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
      partnerId:
        record.role === 'Driver' && partnerAllowedStatuses.includes(inlineEditValues.attendanceStatus)
          ? inlineEditValues.partnerId || undefined
          : undefined,
    };

    updateAttendance.mutate(
      { id: record.id, data: payload },
      {
        onSuccess: () => {
          const itemLabel = `✅ ${record.employeeName}`;
          toast(`✏️ ${itemLabel}`, 'success');
          handleCancelInlineEdit();
        },
        onError: () => {
          toast('Gagal memperbarui rekap kehadiran.', 'error');
        },
      }
    );
  };

  const downloadExcel = async (rows: AttendanceRecord[] = attendanceRecords, label = exportPeriodLabel) => {
    if (currentUser?.role !== 'admin') {
      toast('Akses export hanya tersedia untuk admin.', 'error');
      return;
    }

    if (rows.length === 0) {
      toast('Tidak ada data kehadiran untuk diekspor.', 'error');
      return;
    }

    const adminRows = rows.filter((record) => record.role === 'Admin');
    const driverRows = rows.filter((record) => record.role === 'Driver');
    const labelValue = label || computeExportMonthLabel(new Date().toISOString().slice(0, 7));

    setExportLoading(true);
    try {
      const ExcelJS = (await import('exceljs')) as any;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rekap Schedule');

      worksheet.columns = [
        { key: 'tanggal', width: 14 },
        { key: 'employeeName', width: 22 },
        { key: 'role', width: 14 },
        { key: 'kehadiran', width: 22 },
        { key: 'keterangan', width: 32 },
        { key: 'partnerName', width: 22 },
      ];

      worksheet.addRow(['REKAP SCHEDULE KEHADIRAN']);
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
      worksheet.addRow([]);
      worksheet.addRow(['Periode', labelValue]);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['Tanggal', 'Nama', 'Jabatan', 'Kehadiran', 'Keterangan', 'Partner Driver']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.eachCell((cell: any) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
          right: { style: 'thin', color: { argb: 'FF94A3B8' } },
        };
      });

      rows.forEach((record, index) => {
        const excelRow = worksheet.addRow({
          tanggal: record.tanggal,
          employeeName: record.employeeName,
          role: record.role,
          kehadiran: record.kehadiran,
          keterangan: record.keterangan || '',
          partnerName: record.partnerName || '',
        });
        excelRow.alignment = { vertical: 'middle', wrapText: true };
        if (index % 2 === 1) {
          excelRow.eachCell((cell: any) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
        excelRow.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      });

      worksheet.views = [{ state: 'frozen', ySplit: 4 }];

      const adminStatusKeys = ['Hadir', 'Sakit', 'Izin', 'Alpha'] as const;
      const driverStatusKeys = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Full GW + Deliv', 'Full GW No Deliv', 'GW Setengah', 'Total Hadir'] as const;
      type AdminStatusKey = (typeof adminStatusKeys)[number];
      type DriverStatusKey = (typeof driverStatusKeys)[number];
      type AllStatusKey = AdminStatusKey | DriverStatusKey;

      const createAttendanceCounts = (sourceRows: AttendanceRecord[], statusKeys: readonly AllStatusKey[]) =>
        sourceRows.reduce<Record<string, Record<AllStatusKey, number>>>((acc, record) => {
          const name = record.employeeName;
          if (!acc[name]) {
            acc[name] = statusKeys.reduce((map, key) => {
              map[key] = 0;
              return map;
            }, {} as Record<AllStatusKey, number>);
          }
          const status = record.kehadiran as AllStatusKey;
          if (statusKeys.includes(status)) {
            acc[name][status] += 1;
          }
          return acc;
        }, {} as Record<string, Record<AllStatusKey, number>>);

      const adminCounts = createAttendanceCounts(adminRows, adminStatusKeys);
      const driverCounts = createAttendanceCounts(driverRows, driverStatusKeys);
      const driverPresentCounts = driverRows.reduce<Record<string, number>>((acc, record) => {
        const name = record.employeeName;
        if (!acc[name]) acc[name] = 0;
        if (isDriverPresentStatus(record.kehadiran)) acc[name] += 1;
        return acc;
      }, {});

      Object.entries(driverPresentCounts).forEach(([name, value]) => {
        if (!driverCounts[name]) {
          driverCounts[name] = driverStatusKeys.reduce((map, key) => {
            map[key] = 0;
            return map;
          }, {} as Record<AllStatusKey, number>);
        }
        driverCounts[name]['Total Hadir' as AllStatusKey] = value;
      });

      const summarySheet = workbook.addWorksheet('Ringkasan Kehadiran');
      summarySheet.columns = [
        { width: 20 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 16 },
        { width: 16 },
        { width: 12 },
      ];

      summarySheet.addRow(['RINGKASAN KEHADIRAN']);
      summarySheet.mergeCells('A1:H1');
      summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
      summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.addRow([]);
      summarySheet.addRow(['Periode', labelValue]);
      summarySheet.addRow([]);

      const addSummarySection = (sheet: any, title: string, counts: Record<string, Record<AllStatusKey, number>>, statusKeys: readonly AllStatusKey[]) => {
        sheet.addRow([title]);
        const titleRow = sheet.getRow(sheet.lastRow.number);
        titleRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        sheet.mergeCells(`A${titleRow.number}:H${titleRow.number}`);
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
        titleRow.alignment = { horizontal: 'left', vertical: 'middle' };
        sheet.addRow([]);

        const header = sheet.addRow(['Nama', ...statusKeys]);
        header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        header.alignment = { horizontal: 'center', vertical: 'middle' };
        header.eachCell((cell: any) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            left: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
            right: { style: 'thin', color: { argb: 'FF94A3B8' } },
          };
        });

        Object.entries(counts).forEach(([name, statusCounts]) => {
          const rowValues = [name, ...statusKeys.map((key) => statusCounts[key] ?? 0)];
          const row = sheet.addRow(rowValues);
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.eachCell((cell: any) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          });
        });

        sheet.addRow([]);
      };

      addSummarySection(summarySheet, 'Admin Summary', adminCounts, adminStatusKeys);
      addSummarySection(summarySheet, 'Driver Summary', driverCounts, driverStatusKeys);
      summarySheet.views = [{ state: 'frozen', ySplit: 4 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeLabel = labelValue.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'rekapan_schedule';
      const filename = `rekapan_schedule_${safeLabel}.xlsx`;
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
            {currentUser?.role === 'developer' && (
              <Link href="/manage-users" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Manage User
              </Link>
            )}
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

        {exportPreviewOpen && (
          <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
            <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Preview Export Rekap Schedule</h3>
                    <p className="mt-1 text-sm text-slate-500">Pilih bulan lalu tampilkan preview sebelum mengunduh file Excel.</p>
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
                    <p className="mt-2 text-sm text-slate-500">Pilih periode untuk melihat data kehadiran yang akan diunduh.</p>
                    <input
                      type="month"
                      value={exportSelectedMonth}
                      onChange={(e) => setExportSelectedMonth(e.target.value)}
                      className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                    />
                    <p className="mt-3 text-sm text-slate-600">
                      Bulan terpilih: <span className="font-semibold text-slate-900">{exportSelectedMonth ? computeExportMonthLabel(exportSelectedMonth) : 'Belum dipilih'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
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
                        const rows = attendanceRecords.filter((record) => record.tanggal >= range.startDate && record.tanggal <= range.endDate);
                        if (rows.length === 0) {
                          toast('Tidak ada data untuk bulan tersebut.', 'error');
                          setExportPreviewRows([]);
                          setExportPeriodLabel('');
                          setExportPreviewLoading(false);
                          return;
                        }
                        setExportPreviewRows(rows);
                        setExportPeriodLabel(computeExportMonthLabel(exportSelectedMonth));
                        setExportPreviewLoading(false);
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
                      <thead className="bg-slate-100 text-slate-900">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">No</th>
                          <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                          <th className="px-4 py-3 text-left font-semibold">Nama</th>
                          <th className="px-4 py-3 text-left font-semibold">Jabatan</th>
                          <th className="px-4 py-3 text-left font-semibold">Kehadiran</th>
                          <th className="px-4 py-3 text-left font-semibold">Partner</th>
                          <th className="px-4 py-3 text-left font-semibold">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {exportPreviewRows.slice(0, 8).map((record, index) => (
                          <tr key={record.id} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{index + 1}</td>
                            <td className="px-4 py-3 text-slate-700">{record.tanggal}</td>
                            <td className="px-4 py-3 text-slate-700">{record.employeeName}</td>
                            <td className="px-4 py-3 text-slate-700">{record.role}</td>
                            <td className="px-4 py-3 text-slate-700">{record.kehadiran}</td>
                            <td className="px-4 py-3 text-slate-700">{record.partnerName || '-'}</td>
                            <td className="px-4 py-3 text-slate-700">{record.keterangan || '-'}</td>
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
                      toast('Tampilkan preview terlebih dahulu sebelum download.', 'error');
                      return;
                    }
                    await downloadExcel(exportPreviewRows, exportPeriodLabel || computeExportMonthLabel(exportSelectedMonth));
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

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{currentUser?.role === 'admin' ? 'Form Tambah Karyawan' : 'Form Rekap Kehadiran'}</h2>
              <p className="mt-2 text-sm text-slate-600">Tambahkan karyawan baru sebelum mengisi rekap kehadiran.</p>
            </div>
          </div>

          {currentUser?.role === 'admin' ? (
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
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Form Input Kehadiran</h2>
              <p className="mt-2 text-sm text-slate-600">Isi data kehadiran, lalu klik simpan untuk menambahkan ke tabel rekap.</p>
            </div>
            {canExportData ? (
              <button
                type="button"
                onClick={() => {
                  setExportSelectedMonth((current) => current || new Date().toISOString().slice(0, 7));
                  setExportPreviewRows([]);
                  setExportPeriodLabel('');
                  setExportPreviewOpen(true);
                }}
                disabled={exportLoading}
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {exportLoading ? 'Mempersiapkan...' : 'Export ke Excel'}
              </button>
            ) : null}
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
                  onChange={(event) => {
                    const newStatus = event.target.value as DriverAttendanceStatus;
                    setKehadiran(newStatus);
                    // Clear partner if status doesn't allow partner
                    if (!partnerAllowedStatuses.includes(newStatus)) {
                      setPartnerId('');
                    }
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                >
                  {(selectedEmployee?.role === 'Admin' ? adminStatuses : driverStatuses).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee?.role === 'Driver' && partnerAllowedStatuses.includes(kehadiran) && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Setengah Bersama (Opsional)</label>
                  <select
                    value={partnerId}
                    onChange={(event) => setPartnerId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                  >
                    <option value="">Tidak ada partner</option>
                    {driverPartners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                  {driverPartners.length === 0 && (
                    <p className="mt-2 text-sm text-rose-600">Belum ada driver lain yang tersedia.</p>
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
                    <li>Partner driver bersifat <strong>opsional</strong>. Dapat dikosongkan atau dipilih jika diperlukan untuk status: Hadir, Full GW + Deliv, Full GW No Deliv, GW Setengah.</li>
                    <li>Untuk status Sakit, Izin, Alpha - kolom partner akan otomatis kosong.</li>
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
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Hadir Driver: {driverPresentCount}</span>
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
                {groupedAdmin.length === 0 ? (
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">Belum ada data Admin.</td>
                    </tr>
                  </tbody>
                ) : (
                  groupedAdmin.map(([date, rows]) => (
                    <tbody key={date} className="divide-y divide-slate-200 bg-white">
                      <tr className="bg-slate-100">
                        <td colSpan={6} className="px-6 py-2 font-semibold text-slate-700">{date}</td>
                      </tr>
                      {rows.map((record) => {
                        const idx = adminRecords.findIndex((r) => r.id === record.id);
                        return (
                          <tr key={record.id} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                            <td className="px-6 py-4 font-medium text-slate-900">{idx + 1}</td>
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
                                  {currentUser?.role === 'admin' ? (
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
                                        onClick={() => handleDeleteAttendance(record)}
                                        className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : null}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  ))
                )}
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
                {groupedDriver.length === 0 ? (
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">Belum ada data Driver.</td>
                    </tr>
                  </tbody>
                ) : (
                  groupedDriver.map(([date, rows]) => (
                    <tbody key={date} className="divide-y divide-slate-200 bg-white">
                      <tr className="bg-slate-100">
                        <td colSpan={7} className="px-6 py-2 font-semibold text-slate-700">{date}</td>
                      </tr>
                      {rows.map((record) => {
                        const idx = driverRecords.findIndex((r) => r.id === record.id);
                        return (
                          <tr key={record.id} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                            <td className="px-6 py-4 font-medium text-slate-900">{idx + 1}</td>
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
                                    onChange={(event) => {
                                      const newStatus = event.target.value as DriverAttendanceStatus;
                                      const newInlineEditValues = { ...inlineEditValues, attendanceStatus: newStatus };
                                      // Clear partner if status doesn't allow partner
                                      if (!partnerAllowedStatuses.includes(newStatus)) {
                                        newInlineEditValues.partnerId = '';
                                      }
                                      setInlineEditValues(newInlineEditValues);
                                    }}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                  >
                                    {driverStatuses.map((status) => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                </td>
                                {partnerAllowedStatuses.includes(inlineEditValues.attendanceStatus) && (
                                  <td className="px-6 py-4">
                                    <select
                                      value={inlineEditValues.partnerId}
                                      onChange={(event) => setInlineEditValues((current) => ({ ...current, partnerId: event.target.value }))}
                                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                    >
                                      <option value="">Pilih partner (opsional)</option>
                                      {employees.filter((employee) => employee.role === 'Driver' && employee.id !== record.employeeId).map((employee) => (
                                        <option key={employee.id} value={employee.id}>{employee.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                )}
                                {!partnerAllowedStatuses.includes(inlineEditValues.attendanceStatus) && (
                                  <td className="px-6 py-4">
                                    <span className="text-slate-400">-</span>
                                  </td>
                                )}
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
                                  {currentUser?.role === 'admin' ? (
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
                                        onClick={() => handleDeleteAttendance(record)}
                                        className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : null}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  ))
                )}
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
