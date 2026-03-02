import jwt from 'jsonwebtoken'
import ApiError from '../utils/ApiError.js'
import env from '../config/env.js'

export default function auth(req, res, next) {
  // Try JWT Authorization header first
  const authHeader = req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const decoded = jwt.verify(token, env.jwtSecret)
      req.user = { id: decoded.id, role: decoded.role || 'user' }
      return next()
    } catch {
      return next(new ApiError(401, 'Invalid or expired token'))
    }
  }

  // Fallback: anonymous client-id (for backward compat / WebSocket)
  const clientId = req.header('x-client-id') || req.header('x-user-id')
  if (clientId) {
    req.user = { id: clientId, role: 'user' }
    return next()
  }

  return next(new ApiError(401, 'Authentication required'))
}
