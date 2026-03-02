import redis from '../config/redis.js'

const LOCK_PREFIX = 'seat_lock:'
const LOCK_TTL_SECONDS = 300

export async function acquireSeatLock(seatId, userId) {
  const key = LOCK_PREFIX + seatId
  const res = await redis.set(key, userId, 'NX', 'EX', LOCK_TTL_SECONDS)
  return res === 'OK'
}

export async function releaseSeatLock(seatId) {
  const key = LOCK_PREFIX + seatId
  try {
    await redis.del(key)
  } catch {
  }
}

export async function getSeatLockOwner(seatId) {
  const key = LOCK_PREFIX + seatId
  return redis.get(key)
}

