import type { Request, Response, NextFunction } from 'express'

export type ExpressHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void
export type AsyncExpressHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | number
        email?: string
        role?: string
      }
    }
  }
}

export const asyncHandler = (fn: AsyncExpressHandler) => (req: Request, res: Response, next: NextFunction): void => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
