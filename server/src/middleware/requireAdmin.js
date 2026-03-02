import ApiError from '../utils/ApiError.js'

export default function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return next(new ApiError(403, 'Admin access required'))
    }
    return next()
}
