import { getClient } from '../config/db.js'
import * as seatRepo from '../repositories/seat.repo.js'
import ApiError from '../utils/ApiError.js'
import { acquireSeatLock, releaseSeatLock, getSeatLockOwner } from './lock.service.js'
import { emitSeatLocked, emitSeatReleased } from '../websocket/socket.js'

const LOCK_MS = 5 * 60 * 1000

export async function listSeats(eventId) {
  return seatRepo.getAllSeats(eventId)
}

export async function holdSeat({ seatId, eventId, userId }) {
  const lockAcquired = await acquireSeatLock(eventId, seatId, userId)
  if (!lockAcquired) {
    const owner = await getSeatLockOwner(eventId, seatId)
    if (owner && owner !== userId) {
      throw new ApiError(409, 'Seat is already locked')
    }
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')
    const seat = await seatRepo.getSeatByIdForUpdate(client, seatId, eventId)
    if (!seat) {
      throw new ApiError(404, 'Seat not found')
    }
    if (seat.admin_locked) {
      throw new ApiError(403, 'Seat is reserved by admin')
    }
    if (seat.status === 'sold') {
      throw new ApiError(409, 'Seat already sold')
    }
    if (seat.status === 'locked' && seat.locked_by && seat.locked_by !== userId) {
      throw new ApiError(409, 'Seat is already locked')
    }

    const updatedSeat = await seatRepo.lockSeat(client, seatId, eventId, userId, LOCK_MS)
    await client.query('COMMIT')
    emitSeatLocked(updatedSeat, eventId)
    return updatedSeat
  } catch (err) {
    await client.query('ROLLBACK')
    await releaseSeatLock(eventId, seatId)
    if (err instanceof ApiError) {
      throw err
    }
    throw err
  } finally {
    client.release()
  }
}

export async function releaseSeat({ seatId, eventId, userId }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const seat = await seatRepo.getSeatByIdForUpdate(client, seatId, eventId)
    if (!seat) {
      throw new ApiError(404, 'Seat not found')
    }
    if (seat.status !== 'locked') {
      throw new ApiError(409, 'Seat is not locked')
    }
    if (!seat.locked_by || seat.locked_by !== userId) {
      throw new ApiError(409, 'Seat lock owned by another user')
    }

    const updatedSeat = await seatRepo.releaseSeat(client, seatId, eventId)
    await client.query('COMMIT')
    await releaseSeatLock(eventId, seatId)
    emitSeatReleased(updatedSeat, eventId)
    return updatedSeat
  } catch (err) {
    await client.query('ROLLBACK')
    if (err instanceof ApiError) {
      throw err
    }
    throw err
  } finally {
    client.release()
  }
}
