import redis from '../config/redis.js'

const LOCK_PREFIX = 'seat_lock:'
const LOCK_TTL_SECONDS = 300

export async function acquireSeatLock(eventId: string, seatId: string, userId: string) {
  const key = `${LOCK_PREFIX}${eventId}:${seatId}`
  const res = await redis.set(key, userId, 'EX', LOCK_TTL_SECONDS, 'NX')
  return res === 'OK'
}

export async function releaseSeatLock(eventId: string, seatId: string) {
  const key = `${LOCK_PREFIX}${eventId}:${seatId}`
  try {
    await redis.del(key)
  } catch {
  }
}

export async function getSeatLockOwner(eventId: string, seatId: string) {
  const key = `${LOCK_PREFIX}${eventId}:${seatId}`
  return redis.get(key)
}
