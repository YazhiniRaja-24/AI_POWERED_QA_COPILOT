import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/http';

const body = (code: string, message: string) => ({
  success: false as const,
  error: { code, message },
});

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body('NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    res.status(400).json(body('VALIDATION_ERROR', message));
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json(body(err.code, err.message));
    return;
  }
  if (err && typeof err === 'object' && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json(body('VALIDATION_ERROR', 'Request body is not valid JSON'));
    return;
  }
  console.error('[unhandled error]', err);
  res.status(500).json(body('INTERNAL_ERROR', 'Something went wrong on the server'));
};
