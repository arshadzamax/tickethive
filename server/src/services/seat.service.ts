import { getClient } from '../config/db.js'
import * as seatRepo from '../repositories/seat.repo.js'
import ApiError from '../utils/ApiError.js'
import { acquireSeatLock, releaseSeatLock, getSeatLockOwner } from './lock.service.js'
import { emitSeatLocked, emitSeatReleased } from '../websocket/socket.js'

const LOCK_MS = 5 * 60 * 1000

export async function listSeats(eventId: string | number) {
  return seatRepo.getAllSeats(eventId)
}

interface HoldSeatParams {
  seatId: string | number
  eventId: string | number
  userId: string | number
}

export async function holdSeat({ seatId, eventId, userId }: HoldSeatParams) {
  const lockAcquired = await acquireSeatLock(String(eventId), String(seatId), String(userId))
  if (!lockAcquired) {
    const owner = await getSeatLockOwner(String(eventId), String(seatId))
    if (owner && owner !== String(userId)) {
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
    if (seat.status === 'locked' && seat.locked_by && String(seat.locked_by) !== String(userId)) {
      throw new ApiError(409, 'Seat is already locked')
    }

    const updatedSeat = await seatRepo.lockSeat(client, seatId, eventId, userId, LOCK_MS)
    if (!updatedSeat) {
      throw new ApiError(500, 'Failed to lock seat')
    }
    await client.query('COMMIT')
    emitSeatLocked(updatedSeat, eventId)
    return updatedSeat
  } catch (err) {
    await client.query('ROLLBACK')
    await releaseSeatLock(String(eventId), String(seatId))
    if (err instanceof ApiError) {
      throw err
    }
    throw err
  } finally {
    client.release()
  }
}

interface ReleaseSeatParams {
  seatId: string | number
  eventId: string | number
  userId: string | number
}

export async function releaseSeat({ seatId, eventId, userId }: ReleaseSeatParams) {
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
    if (!seat.locked_by || String(seat.locked_by) !== String(userId)) {
      throw new ApiError(409, 'Seat lock owned by another user')
    }

    const updatedSeat = await seatRepo.releaseSeat(client, seatId, eventId)
    if (!updatedSeat) {
      throw new ApiError(500, 'Failed to release seat')
    }
    await client.query('COMMIT')
    await releaseSeatLock(String(eventId), String(seatId))
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
