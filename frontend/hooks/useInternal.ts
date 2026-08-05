'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';
import {
  RekapanInternalRecord,
  CreateRekapanInternalInput,
  UpdateRekapanInternalInput,
  RekapanInternalSummary,
} from '@/types/internal';

const INTERNAL_LIST_KEY = 'rekapan-internal';
const INTERNAL_SUMMARY_KEY = 'rekapan-internal-summary';

export const useInternalList = (
  page = 1,
  limit = 10,
  search?: string,
  startDate?: string,
  endDate?: string,
  refreshKey?: number
) => {
  return useQuery<ApiResponse<RekapanInternalRecord[]>, Error>({
    queryKey: [INTERNAL_LIST_KEY, page, limit, search, startDate, endDate, refreshKey],
    queryFn: () => apiClient.getRekapanInternalList(page, limit, search, startDate, endDate),
    placeholderData: (previousData?: ApiResponse<RekapanInternalRecord[]>) => previousData,
  });
};

export const useInternalById = (id: string | null) => {
  return useQuery<ApiResponse<RekapanInternalRecord>, Error>({
    queryKey: [INTERNAL_LIST_KEY, 'detail', id],
    queryFn: () => apiClient.getRekapanInternalById(id!),
    enabled: !!id,
  });
};

export const useInternalSummary = (startDate?: string, endDate?: string) => {
  return useQuery<ApiResponse<RekapanInternalSummary>, Error>({
    queryKey: [INTERNAL_SUMMARY_KEY, startDate, endDate],
    queryFn: () => apiClient.getRekapanInternalSummary(startDate, endDate),
    placeholderData: (previousData?: ApiResponse<RekapanInternalSummary>) => previousData,
  });
};

export const useCreateInternal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRekapanInternalInput) => apiClient.createRekapanInternal(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INTERNAL_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [INTERNAL_SUMMARY_KEY] });
    },
  });
};

export const useUpdateInternal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRekapanInternalInput }) =>
      apiClient.updateRekapanInternal(id, data),
    onSuccess: (data, { id }) => {
      qc.invalidateQueries({ queryKey: [INTERNAL_LIST_KEY, 'detail', id] });
      qc.invalidateQueries({ queryKey: [INTERNAL_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [INTERNAL_SUMMARY_KEY] });
    },
  });
};

export const useDeleteInternal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRekapanInternal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INTERNAL_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [INTERNAL_SUMMARY_KEY] });
    },
  });
};
