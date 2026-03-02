import Redis from 'ioredis'
import env from './env.js'
import logger from '../utils/logger.js'

const redis = new Redis(env.redisUrl)

redis.on('error', err => {
  logger.error('Redis error', { err })
})

redis.on('connect', () => {
  logger.info('Redis connected')
})

export default redis

