import { z } from 'zod';

export const RoleEnum = z.enum(['Admin', 'Driver']);
export const AttendanceStatusEnum = z.enum([
  'Hadir',
  'Sakit',
  'Izin',
  'Alpha',
  'Full GW + Deliv',
  'Full GW No Deliv',
  'GW Setengah',
]);

export const CreateEmployeeSchema = z.object({
  name: z.string().trim().min(1, 'Nama karyawan harus diisi'),
  role: RoleEnum,
});

const baseScheduleAttendanceSchema = z.object({
  tanggal: z.coerce.date().describe('Tanggal kehadiran'),
  employeeId: z.string().uuid('Employee ID harus berupa UUID valid'),
  attendanceStatus: AttendanceStatusEnum,
  keterangan: z.string().trim().max(1000, 'Keterangan maksimal 1000 karakter').optional().or(z.literal('')),
  partnerId: z.string().uuid('Partner ID harus UUID valid').optional(),
});

const validateScheduleAttendancePartner = (data: { attendanceStatus?: string; partnerId?: string }, ctx: z.RefinementCtx) => {
  if (data.attendanceStatus === 'GW Setengah' && !data.partnerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Partner driver harus dipilih untuk status GW Setengah',
      path: ['partnerId'],
    });
  }

  if (data.attendanceStatus && data.attendanceStatus !== 'GW Setengah' && data.partnerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Partner hanya boleh dipilih untuk status GW Setengah',
      path: ['partnerId'],
    });
  }
};

export const CreateScheduleAttendanceSchema = baseScheduleAttendanceSchema.superRefine(validateScheduleAttendancePartner);

export const UpdateScheduleAttendanceSchema = baseScheduleAttendanceSchema.partial().superRefine(validateScheduleAttendancePartner);

export const EmployeeIdSchema = z.object({
  id: z.string().uuid('Employee ID harus UUID valid'),
});

export const ScheduleAttendanceIdSchema = z.object({
  id: z.string().uuid('Attendance ID harus UUID valid'),
});

export const ScheduleAttendanceQuerySchema = z.object({
  employeeId: z.string().uuid('Employee ID harus UUID valid').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
  role: RoleEnum.optional(),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type CreateScheduleAttendanceInput = z.infer<typeof CreateScheduleAttendanceSchema>;
export type UpdateScheduleAttendanceInput = z.infer<typeof UpdateScheduleAttendanceSchema>;
export type EmployeeIdInput = z.infer<typeof EmployeeIdSchema>;
export type ScheduleAttendanceIdInput = z.infer<typeof ScheduleAttendanceIdSchema>;
export type ScheduleAttendanceQueryInput = z.infer<typeof ScheduleAttendanceQuerySchema>;
