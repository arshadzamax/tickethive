import type { Request } from 'express'
import ApiError from './ApiError.js'

export function getParamAsNumber(req: Request, key: string): number {
  const value = req.params[key]
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${key}`)
  }
  const num = Number(value)
  if (isNaN(num)) {
    throw new ApiError(400, `Invalid ${key}: must be a number`)
  }
  return num
}

export function getParamAsString(req: Request, key: string): string {
  const value = req.params[key]
  if (!value || typeof value !== 'string') {
    throw new ApiError(400, `Missing required parameter: ${key}`)
  }
  return value
}

export function requireUser(req: Request): { id: string | number; role?: string; email?: string } {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized')
  }
  return req.user
}
