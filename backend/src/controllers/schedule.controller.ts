import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AttendanceStatus } from '@prisma/client';
import {
  CreateEmployeeSchema,
  CreateScheduleAttendanceSchema,
  EmployeeIdSchema,
  ScheduleAttendanceIdSchema,
  ScheduleAttendanceQuerySchema,
  UpdateScheduleAttendanceSchema,
} from '../schemas/schedule.schema';
import { createError, logError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

const attendanceStatusMap: Record<string, string> = {
  Hadir: 'Hadir',
  Sakit: 'Sakit',
  Izin: 'Izin',
  Alpha: 'Alpha',
  'Full GW + Deliv': 'Full_GW_Deliv',
  'Full GW No Deliv': 'Full_GW_No_Deliv',
  'GW Setengah': 'GW_Setengah',
};

const attendanceStatusLabel: Record<string, string> = {
  Hadir: 'Hadir',
  Sakit: 'Sakit',
  Izin: 'Izin',
  Alpha: 'Alpha',
  Full_GW_Deliv: 'Full GW + Deliv',
  Full_GW_No_Deliv: 'Full GW No Deliv',
  GW_Setengah: 'GW Setengah',
};

const parseDateString = (value: string): Date => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    throw createError('Format tanggal tidak valid. Gunakan YYYY-MM-DD', 400);
  }
  return new Date(year, month - 1, day);
};

const normalizeAttendanceRecord = (record: any) => ({
  ...record,
  attendanceStatus: attendanceStatusLabel[record.attendanceStatus] ?? record.attendanceStatus,
});

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json({ success: true, message: 'Daftar karyawan berhasil diambil', data: employees });
  } catch (error) {
    logError(error, 'GET_EMPLOYEES');
    next(error);
  }
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateEmployeeSchema.parse(req.body);
    const employee = await prisma.employee.create({ data: validated });
    res.status(201).json({ success: true, message: 'Karyawan berhasil ditambahkan', data: employee });
  } catch (error) {
    logError(error, 'CREATE_EMPLOYEE');
    next(error);
  }
};

export const getAttendances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ScheduleAttendanceQuerySchema.parse(req.query);
    const where: any = {};

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.role) {
      where.employee = { role: query.role };
    }

    if (query.startDate || query.endDate) {
      where.tanggal = {};
      if (query.startDate) {
        where.tanggal.gte = parseDateString(query.startDate);
      }
      if (query.endDate) {
        const endDate = parseDateString(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.tanggal.lte = endDate;
      }
    }

    const attendances = await prisma.scheduleAttendance.findMany({
      where,
      orderBy: { tanggal: 'desc' },
      include: { employee: true, partner: true },
    });

    res.status(200).json({
      success: true,
      message: 'Data kehadiran berhasil diambil',
      data: attendances.map(normalizeAttendanceRecord),
    });
  } catch (error) {
    logError(error, 'GET_ATTENDANCES');
    next(error);
  }
};

export const getAttendanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ScheduleAttendanceIdSchema.parse(req.params);
    const attendance = await prisma.scheduleAttendance.findUnique({
      where: { id },
      include: { employee: true, partner: true },
    });

    if (!attendance) {
      throw createError('Data kehadiran tidak ditemukan', 404);
    }

    res.status(200).json({ success: true, message: 'Data kehadiran berhasil diambil', data: normalizeAttendanceRecord(attendance) });
  } catch (error) {
    logError(error, 'GET_ATTENDANCE_BY_ID');
    next(error);
  }
};

export const createAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateScheduleAttendanceSchema.parse(req.body);

    if (validated.partnerId && validated.partnerId === validated.employeeId) {
      throw createError('Partner driver tidak boleh sama dengan karyawan utama', 400);
    }

    const employee = await prisma.employee.findUnique({ where: { id: validated.employeeId } });
    if (!employee) {
      throw createError('Karyawan tidak ditemukan', 404);
    }

    if (employee.role === 'Admin' && validated.attendanceStatus.startsWith('Full')) {
      throw createError('Status Full GW hanya berlaku untuk driver', 400);
    }

    if (validated.partnerId) {
      const partner = await prisma.employee.findUnique({ where: { id: validated.partnerId } });
      if (!partner || partner.role !== 'Driver') {
        throw createError('Partner harus karyawan dengan jabatan Driver', 400);
      }
    }

    const attendanceStatus = attendanceStatusMap[validated.attendanceStatus];
    if (!attendanceStatus) {
      throw createError('Status kehadiran tidak valid', 400);
    }

    const attendance = await prisma.scheduleAttendance.create({
      data: {
        tanggal: validated.tanggal,
        employeeId: validated.employeeId,
        attendanceStatus: attendanceStatus as AttendanceStatus,
        keterangan: validated.keterangan || null,
        partnerId: validated.partnerId || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Rekap kehadiran berhasil disimpan',
      data: normalizeAttendanceRecord(attendance),
    });
  } catch (error) {
    logError(error, 'CREATE_ATTENDANCE');
    next(error);
  }
};

export const updateAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ScheduleAttendanceIdSchema.parse(req.params);
    const validated = UpdateScheduleAttendanceSchema.parse(req.body);

    if (validated.partnerId && validated.employeeId && validated.partnerId === validated.employeeId) {
      throw createError('Partner driver tidak boleh sama dengan karyawan utama', 400);
    }

    if (validated.employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: validated.employeeId } });
      if (!employee) {
        throw createError('Karyawan tidak ditemukan', 404);
      }
      if (employee.role === 'Admin' && validated.attendanceStatus?.startsWith('Full')) {
        throw createError('Status Full GW hanya berlaku untuk driver', 400);
      }
    }

    if (validated.partnerId) {
      const partner = await prisma.employee.findUnique({ where: { id: validated.partnerId } });
      if (!partner || partner.role !== 'Driver') {
        throw createError('Partner harus karyawan dengan jabatan Driver', 400);
      }
    }

    const attendanceStatus = validated.attendanceStatus
      ? (attendanceStatusMap[validated.attendanceStatus] as AttendanceStatus)
      : undefined;
    if (validated.attendanceStatus && !attendanceStatus) {
      throw createError('Status kehadiran tidak valid', 400);
    }

    const attendance = await prisma.scheduleAttendance.update({
      where: { id },
      data: {
        tanggal: validated.tanggal,
        employeeId: validated.employeeId,
        attendanceStatus: attendanceStatus ?? undefined,
        keterangan: validated.keterangan !== undefined ? validated.keterangan : undefined,
        partnerId: validated.partnerId !== undefined ? validated.partnerId : undefined,
      },
    });

    res.status(200).json({ success: true, message: 'Data kehadiran berhasil diperbarui', data: normalizeAttendanceRecord(attendance) });
  } catch (error) {
    logError(error, 'UPDATE_ATTENDANCE');
    next(error);
  }
};

export const deleteAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ScheduleAttendanceIdSchema.parse(req.params);
    await prisma.scheduleAttendance.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Data kehadiran berhasil dihapus' });
  } catch (error) {
    logError(error, 'DELETE_ATTENDANCE');
    next(error);
  }
};

export const getScheduleSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const total = await prisma.scheduleAttendance.count();
    const byRole = await prisma.scheduleAttendance.groupBy({
      by: ['employeeId'],
      _count: { _all: true },
    });
    const statusCounts = await prisma.scheduleAttendance.groupBy({
      by: ['attendanceStatus'],
      _count: { _all: true },
    });

    const employeeDetails = await prisma.employee.findMany();
    const roleMap = employeeDetails.reduce<Record<string, string>>((acc, employee) => {
      acc[employee.id] = employee.role;
      return acc;
    }, {});

    const byRoleSummary = byRole.map((row) => ({
      employeeId: row.employeeId,
      role: roleMap[row.employeeId] ?? 'Unknown',
      count: row._count._all,
    }));

    res.status(200).json({
      success: true,
      message: 'Ringkasan schedule berhasil diambil',
      data: {
        total,
        byRole: byRoleSummary,
        byStatus: statusCounts.map((row) => ({ status: row.attendanceStatus, count: row._count._all })),
      },
    });
  } catch (error) {
    logError(error, 'GET_SCHEDULE_SUMMARY');
    next(error);
  }
};
