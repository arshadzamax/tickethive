import { Request, Response, NextFunction } from 'express'
import ApiError from '../utils/ApiError.js'

export default function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== 'admin') {
        return next(new ApiError(403, 'Admin access required'))
    }
    return next()
}
