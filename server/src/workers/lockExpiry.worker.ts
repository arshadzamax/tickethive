import env from '../config/env.js'
import logger from '../utils/logger.js'
import { expireLockedSeats } from '../repositories/seat.repo.js'
import { Redis } from 'ioredis'

const publisher = env.redisUrl ? new Redis(env.redisUrl) : new Redis()

async function runOnce() {
  try {
    const expiredSeats = await expireLockedSeats()
    if (expiredSeats.length) {
      logger.info('Expired seat locks', { count: expiredSeats.length })
      for (const seat of expiredSeats) {
        const payload = JSON.stringify({
          event: 'seat_released',
          eventId: seat.event_id,
          seat
        })
        await publisher.publish('seat_events', payload)
      }
    }
  } catch (err) {
    const error = err as Error
    logger.error('lockExpiry worker error', { error: error.message })
  }
}

async function main() {
  logger.info('Lock expiry worker started')
  await runOnce()
  setInterval(runOnce, 30000)
}

main().catch(err => {
  const error = err as Error
  logger.error('Worker fatal error', { error: error.message })
  process.exit(1)
})

