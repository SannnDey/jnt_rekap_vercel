import { NextRequest } from 'next/server';

export const getQueryParam = (request: NextRequest, key: string): string => {
  return request.nextUrl.searchParams.get(key) ?? '';
};

export const parseIntParam = (request: NextRequest, key: string, fallback = 0): number => {
  const value = request.nextUrl.searchParams.get(key);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseBoolParam = (request: NextRequest, key: string): boolean => {
  const value = request.nextUrl.searchParams.get(key);
  return String(value).toLowerCase() === 'true';
};

export const parseDateParam = (request: NextRequest, key: string): Date | undefined => {
  const value = request.nextUrl.searchParams.get(key);
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
