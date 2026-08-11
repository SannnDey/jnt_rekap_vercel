import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { PayrollRate, PayrollHistory } from '@/types';

const PAYROLL_RATE_KEY = 'payroll-rate';
const PAYROLL_HISTORY_KEY = 'payroll-history';

type PayrollRateInput = Omit<PayrollRate, 'id' | 'month' | 'createdAt' | 'updatedAt'>;
type PayrollHistoryInput = Omit<PayrollHistory, 'id' | 'month' | 'createdAt' | 'updatedAt'>;

export const usePayrollRate = (month?: string) => {
  return useQuery<PayrollRate | null, Error>({
    queryKey: [PAYROLL_RATE_KEY, month],
    queryFn: async () => {
      const response = await apiClient.getPayrollRate(month);
      return response.data ?? null;
    },
    enabled: Boolean(month),
  });
};

export const useUpsertPayrollRate = () => {
  const queryClient = useQueryClient();

  return useMutation<PayrollRate, Error, { month: string; data: PayrollRateInput }>({
    mutationFn: async ({ month, data }) => {
      const response = await apiClient.updatePayrollRate(month, data);
      if (!response.data) {
        throw new Error('Tarif payroll tidak tersedia');
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PAYROLL_RATE_KEY, variables.month] });
    },
  });
};

export const usePayrollHistory = (month?: string) => {
  return useQuery<PayrollHistory[], Error>({
    queryKey: [PAYROLL_HISTORY_KEY, month],
    queryFn: async () => {
      const response = await apiClient.getPayrollHistory(month);
      return response.data ?? [];
    },
    enabled: Boolean(month),
  });
};

export const useSavePayrollHistory = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { month: string; rows: PayrollHistoryInput[] }>({
    mutationFn: async ({ month, rows }) => {
      const response = await apiClient.savePayrollHistory(month, rows);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PAYROLL_HISTORY_KEY, variables.month] });
    },
  });
};
