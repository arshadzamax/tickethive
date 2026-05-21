import dotenv from 'dotenv'

dotenv.config()

interface Env {
  nodeEnv: string
  port: number
  databaseUrl: string | undefined
  redisUrl: string | undefined
  corsOrigin: string | undefined
  rateLimitWindowMs: number
  rateLimitMax: number
  logLevel: string
  jwtSecret: string | undefined
}

const env: Env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: process.env.JWT_SECRET
}

// Production safety checks
if (env.nodeEnv === 'production') {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required in production')
  }

  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is required in production')
  }

  if (!env.redisUrl) {
    throw new Error('REDIS_URL is required in production')
  }
}

export default env