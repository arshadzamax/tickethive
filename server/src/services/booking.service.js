import { v4 as uuidv4 } from 'uuid'
import { getClient } from '../config/db.js'
import * as seatRepo from '../repositories/seat.repo.js'
import * as orderRepo from '../repositories/order.repo.js'
import ApiError from '../utils/ApiError.js'
import { releaseSeatLock } from './lock.service.js'
import { emitSeatSold } from '../websocket/socket.js'

export async function confirmSeat({ seatId, userId }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const seat = await seatRepo.getSeatByIdForUpdate(client, seatId)
    if (!seat) {
      throw new ApiError(404, 'Seat not found')
    }
    const now = new Date()
    if (seat.status !== 'locked') {
      throw new ApiError(409, 'Seat is not locked')
    }
    if (!seat.locked_by || seat.locked_by !== userId) {
      throw new ApiError(409, 'Seat lock owned by another user')
    }
    if (seat.lock_expires_at && new Date(seat.lock_expires_at) < now) {
      throw new ApiError(409, 'Seat lock expired')
    }

    const updatedSeat = await seatRepo.markSeatSold(client, seatId)
    try {
      await orderRepo.createOrder(client, {
        id: uuidv4(),
        userId,
        seatId,
        paymentStatus: 'paid'
      })
    } catch (e) {
      if (e && e.code === '23505') {
        throw new ApiError(409, 'Order already exists for seat')
      }
      throw e
    }

    await client.query('COMMIT')
    await releaseSeatLock(seatId)
    emitSeatSold(updatedSeat)
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

