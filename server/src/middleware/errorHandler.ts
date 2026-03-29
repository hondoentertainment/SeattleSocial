import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { config } from '../config';

/**
 * Global error handler middleware.
 * Catches all errors, formats them as JSON, and sends a proper status code.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string; meta?: Record<string, unknown> };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        error: {
          message: 'A record with that value already exists.',
          statusCode: 409,
        },
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        error: {
          message: 'Record not found.',
          statusCode: 404,
        },
      });
      return;
    }
  }

  // JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: {
        message: 'Invalid JSON in request body.',
        statusCode: 400,
      },
    });
    return;
  }

  // Unexpected errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: config.nodeEnv === 'production' ? 'Internal server error.' : err.message,
      statusCode: 500,
    },
  });
}
