'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  RekapanOutgoing,
  ApiResponse,
  CreateRekapanInput,
  UpdateRekapanInput,
  SummaryData,
} from '@/types';

const REKAPAN_QUERY_KEY = 'rekapan';
const REKAPAN_SUMMARY_KEY = 'rekapan-summary';

// Fetch all rekapan
export const useRekapanList = (
  page = 1,
  limit = 10,
  search?: string,
  startDate?: string,
  endDate?: string,
  refreshKey?: number
) => {
  return useQuery<ApiResponse<RekapanOutgoing[]>, Error>({
    queryKey: [REKAPAN_QUERY_KEY, page, limit, search, startDate, endDate, refreshKey],
    queryFn: () => apiClient.getRekapanList(page, limit, search, startDate, endDate),
    placeholderData: (previousData?: ApiResponse<RekapanOutgoing[]>) => previousData,
  });
};

// Fetch single rekapan
export const useRekapanById = (id: string | null) => {
  return useQuery({
    queryKey: [REKAPAN_QUERY_KEY, 'detail', id],
    queryFn: () => apiClient.getRekapanById(id!),
    enabled: !!id,
  });
};

// Fetch summary
export const useRekapanSummary = (startDate?: string, endDate?: string) => {
  return useQuery<ApiResponse<SummaryData>, Error>({
    queryKey: [REKAPAN_SUMMARY_KEY, startDate, endDate],
    queryFn: () => apiClient.getRekapanSummary(startDate, endDate),
    placeholderData: (previousData?: ApiResponse<SummaryData>) => previousData,
  });
};

// Create rekapan
export const useCreateRekapan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRekapanInput) => apiClient.createRekapan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REKAPAN_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REKAPAN_SUMMARY_KEY] });
    },
  });
};

// Update rekapan
export const useUpdateRekapan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRekapanInput }) =>
      apiClient.updateRekapan(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [REKAPAN_QUERY_KEY, 'detail', id] });
      queryClient.invalidateQueries({ queryKey: [REKAPAN_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REKAPAN_SUMMARY_KEY] });
    },
  });
};

// Delete rekapan
export const useDeleteRekapan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRekapan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REKAPAN_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REKAPAN_SUMMARY_KEY] });
    },
  });
};
