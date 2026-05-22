import { Redis } from 'ioredis'
import env from './env.js'
import logger from '../utils/logger.js'

const redis = env.redisUrl ? new Redis(env.redisUrl) : new Redis()

redis.on('error', (err: unknown) => {
  logger.error('Redis error', { err })
})

redis.on('connect', () => {
  logger.info('Redis connected')
})

export default redis

