'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { ApiResponse, ScheduleEmployee, ScheduleAttendanceApi } from '@/types';

const SCHEDULE_EMPLOYEES_KEY = 'schedule-employees';
const SCHEDULE_ATTENDANCES_KEY = 'schedule-attendances';
const SCHEDULE_SUMMARY_KEY = 'schedule-summary';

export const useScheduleEmployees = () => {
  return useQuery<ScheduleEmployee[], Error>({
    queryKey: [SCHEDULE_EMPLOYEES_KEY],
    queryFn: async () => {
      const response = await apiClient.getScheduleEmployees();
      return response.data ?? [];
    },
  });
};

export const useCreateScheduleEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; role: 'Admin' | 'Driver' }) => apiClient.createScheduleEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULE_EMPLOYEES_KEY] });
    },
  });
};

export const useScheduleAttendances = (
  employeeId?: string,
  role?: 'Admin' | 'Driver',
  startDate?: string,
  endDate?: string
) => {
  return useQuery<ScheduleAttendanceApi[], Error>({
    queryKey: [SCHEDULE_ATTENDANCES_KEY, employeeId, role, startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.getScheduleAttendances(employeeId, role, startDate, endDate);
      return response.data ?? [];
    },
    enabled: true,
  });
};

export const useCreateScheduleAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tanggal: string | Date;
      employeeId: string;
      attendanceStatus: string;
      keterangan?: string;
      partnerId?: string;
    }) => apiClient.createScheduleAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULE_ATTENDANCES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SCHEDULE_SUMMARY_KEY] });
    },
  });
};

export const useUpdateScheduleAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: {
      tanggal?: string | Date;
      employeeId?: string;
      attendanceStatus?: string;
      keterangan?: string;
      partnerId?: string;
    } }) => apiClient.updateScheduleAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULE_ATTENDANCES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SCHEDULE_SUMMARY_KEY] });
    },
  });
};

export const useDeleteScheduleAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteScheduleAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULE_ATTENDANCES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SCHEDULE_SUMMARY_KEY] });
    },
  });
};

export const useScheduleSummary = () => {
  return useQuery<any, Error>({
    queryKey: [SCHEDULE_SUMMARY_KEY],
    queryFn: async () => {
      const response = await apiClient.getScheduleSummary();
      return response.data;
    },
  });
};
