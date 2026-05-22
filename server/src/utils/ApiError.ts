export default class ApiError extends Error {
  statusCode: number
  details: unknown
  isOperational: boolean

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true
  }
}

