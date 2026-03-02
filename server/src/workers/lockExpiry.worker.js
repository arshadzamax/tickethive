import env from '../config/env.js'
import logger from '../utils/logger.js'
import { expireLockedSeats } from '../repositories/seat.repo.js'
import Redis from 'ioredis'

const publisher = new Redis(env.redisUrl)

async function runOnce() {
  try {
    const expiredSeats = await expireLockedSeats()
    if (expiredSeats.length) {
      logger.info('Expired seat locks', { count: expiredSeats.length })
      for (const seat of expiredSeats) {
        const payload = JSON.stringify({ event: 'seat_released', seat })
        await publisher.publish('seat_events', payload)
      }
    }
  } catch (err) {
    logger.error('lockExpiry worker error', { error: err.message })
  }
}

async function main() {
  logger.info('Lock expiry worker started')
  await runOnce()
  setInterval(runOnce, 30000)
}

main().catch(err => {
  logger.error('Worker fatal error', { error: err.message })
  process.exit(1)
})

