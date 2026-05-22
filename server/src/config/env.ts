import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(4000),
  databaseUrl: z.string().optional(),
  redisUrl: z.string().optional(),
  corsOrigin: z.string().optional(),
  rateLimitWindowMs: z.coerce.number().default(60000),
  rateLimitMax: z.coerce.number().default(100),
  logLevel: z.string().default('info'),
  jwtSecret: z.string().default('development_secret_key_tickethive')
}).refine((data) => {
  if (data.nodeEnv === 'production') {
    return !!data.databaseUrl && !!data.redisUrl && data.jwtSecret !== 'development_secret_key_tickethive'
  }
  return true;
}, {
  message: "DATABASE_URL, JWT_SECRET, and REDIS_URL are strictly required in production mode, and JWT_SECRET must be customized"
})

const parsed = envSchema.safeParse({
  nodeEnv: process.env['NODE_ENV'],
  port: process.env['PORT'],
  databaseUrl: process.env['DATABASE_URL'],
  redisUrl: process.env['REDIS_URL'],
  corsOrigin: process.env['CORS_ORIGIN'],
  rateLimitWindowMs: process.env['RATE_LIMIT_WINDOW_MS'],
  rateLimitMax: process.env['RATE_LIMIT_MAX'],
  logLevel: process.env['LOG_LEVEL'],
  jwtSecret: process.env['JWT_SECRET']
})

if (!parsed.success) {
  console.error('❌ Environment validation failed:')
  console.error(JSON.stringify(parsed.error.format(), null, 2))
  process.exit(1)
}

export type Env = z.infer<typeof envSchema>
const env = parsed.data

export default env