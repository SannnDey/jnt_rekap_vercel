'use client';

import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { ApiResponse, KasbonRecord, KasbonSummary } from '@/types';

export const KASBON_LIST_KEY = 'kasbon-list';
export const KASBON_SUMMARY_KEY = 'kasbon-summary';

export const useKasbonList = (
  page = 1,
  limit = 50,
  employee?: string,
  startDate?: string,
  endDate?: string,
  refreshKey?: number
) => {
  return useQuery<ApiResponse<KasbonRecord[]>, Error>({
    queryKey: [KASBON_LIST_KEY, page, limit, employee, startDate, endDate, refreshKey],
    queryFn: () => apiClient.getKasbonList(page, limit, employee, startDate, endDate),
    placeholderData: (prev?: ApiResponse<KasbonRecord[]>) => prev,
  });
};

export const useKasbonSummary = (startDate?: string, endDate?: string) => {
  return useQuery<ApiResponse<KasbonSummary>, Error>({
    queryKey: [KASBON_SUMMARY_KEY, startDate, endDate],
    queryFn: () => apiClient.getKasbonSummary(startDate, endDate),
    placeholderData: (prev?: ApiResponse<KasbonSummary>) => prev,
  });
};

export const useCreateKasbon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createKasbon(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KASBON_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [KASBON_SUMMARY_KEY] });
    },
  });
};

export const useUpdateKasbon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateKasbon(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KASBON_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [KASBON_SUMMARY_KEY] });
    },
  });
};

export const useDeleteKasbon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteKasbon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KASBON_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [KASBON_SUMMARY_KEY] });
    },
  });
};
