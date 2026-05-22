import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import ApiError from '../utils/ApiError.js'
import logger from '../utils/logger.js'

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  let error: ApiError

  if (err instanceof ApiError) {
    error = err
  } else if (err instanceof ZodError) {
    error = new ApiError(400, 'Validation failed', err.issues)
  } else {
    error = new ApiError(500, err instanceof Error ? err.message : 'Internal Server Error')
  }

  const status = error.statusCode
  const payload: { message: string; details?: unknown } = {
    message: status === 500 ? 'Internal server error' : error.message
  }
  if (error.details) {
    payload.details = error.details
  }

  logger.error('Request error', {
    status,
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err)
  })

  res.status(status).json(payload)
}

