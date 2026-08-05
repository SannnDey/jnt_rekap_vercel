import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('DD MMM YYYY');
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD MMM YYYY HH:mm');
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

export const parseFormattedNumber = (value: string): string => {
  if (!value) return '';
  const normalized = String(value).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return '';
  return parsed.toFixed(0);
};

export const formatWeight = (kg: number): string => {
  // Always display weight in kilograms to match imported Excel data units
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kg)} kg`;
};

export const parseDate = (dateString: string): Date => {
  return dayjs(dateString).toDate();
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const getFriendlyErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Record<string, unknown>;
      if (typeof data.message === 'string' && data.message.length > 0) {
        return data.message
          .replace(/https?:\/\/[^\s]*/gi, '')
          .replace(/localhost[:\d]*/gi, '')
          .trim() || 'Terjadi kesalahan saat memproses permintaan.';
      }
    }

    if (error.message?.includes('Network Error') || error.code === 'ECONNREFUSED') {
      return 'Tidak dapat terhubung ke server. Silakan periksa koneksi dan coba lagi.';
    }

    return error.message
      .replace(/https?:\/\/[^\s]*/gi, '')
      .replace(/localhost[:\d]*/gi, '')
      .trim() || 'Terjadi kesalahan saat memproses permintaan.';
  }

  if (error instanceof Error) {
    return error.message
      .replace(/https?:\/\/[^\s]*/gi, '')
      .replace(/localhost[:\d]*/gi, '')
      .trim() || 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
  }

  return 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
};

export const computeExportMonthLabel = (month: string): string => {
  // month: YYYY-MM
  try {
    return dayjs(month + '-01').format('MMMM YYYY');
  } catch (e) {
    return month;
  }
};

export const getMonthRange = (month: string): { startDate: string; endDate: string } | null => {
  // month: YYYY-MM -> return start and end in YYYY-MM-DD
  if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) return null;
  const start = dayjs(month + '-01').startOf('month');
  const end = dayjs(month + '-01').endOf('month');
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
};
