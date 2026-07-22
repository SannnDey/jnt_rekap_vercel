import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
  timestamp: string;
}

/**
 * Log error to console
 */
export const logError = (error: unknown, context: string = 'Error') => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${context}:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
};

/**
 * Format error response
 */
export const formatErrorResponse = (
  message: string,
  error?: unknown,
  statusCode: number = 500
): [ErrorResponse, number] => {
  return [
    {
      success: false,
      message,
      error: error instanceof Error ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error : undefined,
      timestamp: new Date().toISOString(),
    },
    statusCode,
  ];
};

/**
 * Handle Zod validation errors
 */
export const handleZodError = (error: ZodError) => {
  const formattedErrors = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return formatErrorResponse('Validasi input gagal', formattedErrors, 400);
};

/**
 * Handle Prisma errors
 */
export const handlePrismaError = (error: any) => {
  // Unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return formatErrorResponse(`${field} sudah ada di database`, error, 409);
  }

  // Record not found
  if (error.code === 'P2025') {
    return formatErrorResponse('Data tidak ditemukan', error, 404);
  }

  // Foreign key constraint violation
  if (error.code === 'P2003') {
    return formatErrorResponse('Referensi data tidak valid', error, 400);
  }

  // Invalid ID format
  if (error.code === 'P2023') {
    return formatErrorResponse('Format ID tidak valid', error, 400);
  }

  // Validation error (e.g., invalid enum value)
  if (error instanceof PrismaClientValidationError) {
    return formatErrorResponse('Data validation error', error, 400);
  }

  // Generic Prisma error
  return formatErrorResponse('Database error', error, 500);
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const timestamp = new Date().toISOString();

  // Log error
  logError(err, `[${req.method}] ${req.path}`);

  try {
    // Zod validation error
    if (err instanceof ZodError) {
      const [errResponse, statusCode] = handleZodError(err);
      return res.status(statusCode).json(errResponse);
    }

    // Prisma known request error
    if (err instanceof PrismaClientKnownRequestError) {
      const [errResponse, statusCode] = handlePrismaError(err);
      return res.status(statusCode).json(errResponse);
    }

    // Prisma validation error
    if (err instanceof PrismaClientValidationError) {
      const [errResponse, statusCode] = handlePrismaError(err);
      return res.status(statusCode).json(errResponse);
    }

    // Custom error with status code
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        timestamp,
      });
    }

    // Unknown error
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp,
    });
  } catch (handlerError) {
    logError(handlerError, 'Error Handler Exception');
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Not found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create custom error
 */
export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string
): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};
