export default class ApiError extends Error {
  statusCode: number
  details: any
  isOperational: boolean

  constructor(statusCode: number, message: string, details?: any) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true
  }
}

