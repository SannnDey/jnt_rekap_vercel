'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { ApiResponse, PengeluaranRecord, PengeluaranSummary } from '@/types';

const PENGELUARAN_QUERY_KEY = 'pengeluaran';
const PENGELUARAN_SUMMARY_KEY = 'pengeluaran-summary';

export const usePengeluaranList = (
  page = 1,
  limit = 50,
  kategori?: string,
  startDate?: string,
  endDate?: string,
  refreshKey?: number
) => {
  return useQuery({
    queryKey: [PENGELUARAN_QUERY_KEY, page, limit, kategori, startDate, endDate, refreshKey],
    queryFn: () => apiClient.getPengeluaranList(page, limit, kategori, startDate, endDate),
    placeholderData: (prev: any) => prev,
  });
};

export const usePengeluaranSummary = (kategori?: string, startDate?: string, endDate?: string) => {
  return useQuery<ApiResponse<PengeluaranSummary>>({
    queryKey: [PENGELUARAN_SUMMARY_KEY, kategori, startDate, endDate],
    queryFn: () => apiClient.getPengeluaranSummary(kategori, startDate, endDate),
    placeholderData: (prev: any) => prev,
  });
};

export const useCreatePengeluaran = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPengeluaran(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENGELUARAN_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [PENGELUARAN_SUMMARY_KEY] });
    },
  });
};

export const useUpdatePengeluaran = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updatePengeluaran(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENGELUARAN_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [PENGELUARAN_SUMMARY_KEY] });
    },
  });
};

export const useDeletePengeluaran = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePengeluaran(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENGELUARAN_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: [PENGELUARAN_SUMMARY_KEY] });
    },
  });
};
