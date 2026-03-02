import ApiError from '../utils/ApiError.js'
import logger from '../utils/logger.js'

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const status = err instanceof ApiError && err.statusCode ? err.statusCode : 500
  const payload = {
    message: status === 500 ? 'Internal server error' : err.message
  }
  if (err instanceof ApiError && err.details) {
    payload.details = err.details
  }

  logger.error('Request error', {
    status,
    path: req.path,
    method: req.method,
    error: err.message
  })

  res.status(status).json(payload)
}

