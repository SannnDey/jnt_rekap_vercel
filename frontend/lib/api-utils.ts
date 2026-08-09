import { NextResponse } from 'next/server';

export const jsonResponse = (data: unknown, status = 200) => {
  return NextResponse.json(data, { status });
};

export const errorResponse = (message: string, status = 400, details?: unknown) => {
  return NextResponse.json(
    {
      success: false,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

export const notFoundResponse = (message = 'Endpoint tidak ditemukan') => {
  return errorResponse(message, 404);
};
