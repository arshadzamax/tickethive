import redis from '../config/redis.js'
import logger from '../utils/logger.js'

const LOCK_PREFIX = 'group_lock:'
const LOCK_TTL_SECONDS = 300 // 5 minutes

interface GroupLockData {
  userId: string
  eventId: string | number
  itemIds: (string | number)[]
  itemType: string
  acquiredAt: string
}

/**
 * Acquire locks on multiple seats/tickets atomically
 * For SEATED: locks multiple seats at once
 * For GENERAL: locks ticket capacity reservation
 */
export async function acquireGroupLock(eventId: string | number, itemIds: (string | number)[], userId: string, itemType: string = 'seat') {
  const groupLockId = `${LOCK_PREFIX}${eventId}:${userId}:${Date.now()}`
  const lockValue = JSON.stringify({
    userId,
    eventId,
    itemIds,
    itemType,
    acquiredAt: new Date().toISOString()
  })

  try {
    // Set group lock
    const result = await redis.set(groupLockId, lockValue, 'EX', LOCK_TTL_SECONDS, 'NX')
    
    if (!result) {
      logger.warn(`Failed to acquire group lock for user ${userId}`)
      return null
    }

    // Store group lock ID in user's lock set for easy cleanup
    await redis.sadd(`user_locks:${userId}`, groupLockId)
    await redis.expire(`user_locks:${userId}`, LOCK_TTL_SECONDS)

    return groupLockId
  } catch (err) {
    logger.error('Error acquiring group lock', { err, eventId, userId })
    throw err
  }
}

/**
 * Release a group lock and all associated item locks
 */
export async function releaseGroupLock(groupLockId: string, userId: string) {
  try {
    // Get group lock details
    const lockData = await redis.get(groupLockId)
    if (!lockData) return false

    const { itemIds } = JSON.parse(lockData) as GroupLockData

    // Release all individual locks (if they exist)
    if (itemIds && Array.isArray(itemIds)) {
      const pipeline = redis.pipeline()
      itemIds.forEach(itemId => {
        pipeline.del(`seat_lock:${itemId}`)
      })
      await pipeline.exec()
    }

    // Remove group lock
    await redis.del(groupLockId)
    await redis.srem(`user_locks:${userId}`, groupLockId)

    return true
  } catch (err) {
    logger.error('Error releasing group lock', { err, groupLockId })
    throw err
  }
}

/**
 * Get all active locks for a user
 */
export async function getUserLocks(userId: string) {
  try {
    const lockIds = await redis.smembers(`user_locks:${userId}`)
    if (!lockIds || lockIds.length === 0) return []

    const pipeline = redis.pipeline()
    lockIds.forEach((lockId: string) => {
      pipeline.get(lockId)
    })
    const results = await pipeline.exec()

    if (!results) return []

    const mapped: { id: string; data: GroupLockData }[] = []
    results.forEach((result: [Error | null, unknown], idx: number) => {
      if (result && result[1]) {
        const lockId = lockIds[idx]
        if (lockId) {
          mapped.push({ id: lockId, data: JSON.parse(String(result[1])) as GroupLockData })
        }
      }
    })
    return mapped
  } catch (err) {
    logger.error('Error getting user locks', { err, userId })
    return []
  }
}

/**
 * Cleanup expired locks for a user
 */
export async function cleanupUserLocks(userId: string) {
  try {
    const lockIds = await redis.smembers(`user_locks:${userId}`)
    if (!lockIds || lockIds.length === 0) return

    const pipeline = redis.pipeline()
    lockIds.forEach((lockId: string) => {
      pipeline.get(lockId)
    })
    const results = await pipeline.exec()

    const expiredLockIds: string[] = []
    if (results) {
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        if (!result || !result[1]) {
          const lockId = lockIds[i]
          if (lockId) {
            expiredLockIds.push(lockId)
          }
        }
      }
    }

    if (expiredLockIds.length > 0) {
      await redis.srem(`user_locks:${userId}`, ...expiredLockIds)
    }
  } catch (err) {
    logger.error('Error cleaning up user locks', { err, userId })
  }
}
