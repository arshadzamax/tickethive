import { query, getClient } from '../config/db.js'
import ApiError from '../utils/ApiError.js'
import logger from '../utils/logger.js'
import * as lockService from './lock.service.js'
import * as groupLockService from './groupLock.service.js'
import { emitSeatSold } from '../websocket/socket.js'
import { v4 as uuidv4 } from 'uuid'

export interface SeatedBookingItems {
  seats: (string | number)[]
}

export interface GeneralBookingItems {
  quantity: number
  category?: string
}

export type BookingItems = SeatedBookingItems | GeneralBookingItems

export interface SeatedValidationResult {
  allAvailable: boolean
  unavailableSeats: (string | number)[]
  totalSeats: number
}

export interface GeneralValidationResult {
  isAvailable: boolean
  remaining: number
  requested: number
  totalCapacity: number
  sold: number
}

export type ValidationResult = SeatedValidationResult | GeneralValidationResult

export interface SeatedHoldResult {
  groupLockId: string
  lockedSeats: (string | number)[]
}

export interface GeneralHoldResult {
  groupLockId: string
  reservedTickets: string[]
}

export type HoldResult = SeatedHoldResult | GeneralHoldResult

export interface SeatedOrderResponse {
  id: string
  seatId: string
  category: string
  price: number
}

export interface GeneralOrderResponse {
  id: string
  ticketCount: number
  category?: string
  pricePerUnit: number
  totalAmount: number
}

export interface GroupBookingResult {
  groupBookingId: string
  orders: SeatedOrderResponse[] | GeneralOrderResponse[]
  totalAmount: number
  itemCount: number
  addonTotal?: number
  discountAmount?: number
}

/**
 * SEATED event booking strategy
 * Handles multi-seat selection with atomic locking
 */
export const seatedBooking = {
  async validateAvailability(eventId: string | number, seatIds: (string | number)[]) {
    const placeholders = seatIds.map((_, i) => `$${i + 2}`).join(',')
    const res = await query(
      `SELECT id, status FROM seats WHERE event_id = $1 AND id IN (${placeholders})`,
      [eventId, ...seatIds]
    )

    const seatMap = new Map(res.rows.map(s => [s.id, s.status]))
    const unavailable = seatIds.filter(id => seatMap.get(id) !== 'available')

    return {
      allAvailable: unavailable.length === 0,
      unavailableSeats: unavailable,
      totalSeats: res.rows.length
    }
  },

  async holdMultipleSeats(eventId: string | number, seatIds: (string | number)[], userId: string | number) {
    const validation = await this.validateAvailability(eventId, seatIds)
    if (!validation.allAvailable) {
      throw new ApiError(409, `Seats unavailable: ${validation.unavailableSeats.join(', ')}`)
    }

    // Acquire group lock
    const groupLockId = await groupLockService.acquireGroupLock(eventId, seatIds, String(userId), 'seat')
    if (!groupLockId) {
      throw new ApiError(409, 'Could not acquire lock on seats. Please try again.')
    }

    // Lock individual seats for WebSocket broadcasting
    for (const seatId of seatIds) {
      await lockService.acquireSeatLock(String(eventId), String(seatId), String(userId))
    }

    return { groupLockId, lockedSeats: seatIds }
  },

  async releaseSeats(eventId: string | number, seatIds: (string | number)[], userId: string | number, groupLockId: string) {
    // Release group lock
    if (groupLockId) {
      await groupLockService.releaseGroupLock(groupLockId, String(userId))
    }

    // Release individual locks
    for (const seatId of seatIds) {
      await lockService.releaseSeatLock(String(eventId), String(seatId))
    }
  },

  async createGroupOrder(eventId: string | number, userId: string | number, seatIds: (string | number)[], paymentStatus: string = 'pending') {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      // Get seat details
      const placeholders = seatIds.map((_, i) => `$${i + 2}`).join(',')
      const seatsRes = await client.query(
        `SELECT id, category FROM seats WHERE event_id = $1 AND id IN (${placeholders})`,
        [eventId, ...seatIds]
      )

      // Get event pricing
      const eventRes = await client.query(
        'SELECT price_normal, price_premium FROM events WHERE id = $1',
        [eventId]
      )
      const { price_normal, price_premium } = eventRes.rows[0]

      // Calculate total amount first
      const groupBookingId = uuidv4()
      let totalAmount = 0
      const orders: SeatedOrderResponse[] = []

      for (const seat of seatsRes.rows) {
        const category = seat.category
        const pricePerUnit = category === 'PREMIUM' ? price_premium : price_normal
        totalAmount += Number(pricePerUnit)
      }

      // Create group booking record FIRST (orders FK references this)
      await client.query(
        `INSERT INTO group_bookings (id, user_id, event_id, total_amount, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [groupBookingId, userId, eventId, totalAmount, paymentStatus === 'paid' ? 'completed' : 'pending']
      )

      // Now create individual orders
      for (const seat of seatsRes.rows) {
        const orderId = uuidv4()
        const category = seat.category
        const pricePerUnit = category === 'PREMIUM' ? price_premium : price_normal

        await client.query(
          `INSERT INTO orders (id, event_id, user_id, group_booking_id, seat_id, category, price_per_unit, total_amount, payment_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [orderId, eventId, userId, groupBookingId, seat.id, category, pricePerUnit, pricePerUnit, paymentStatus]
        )

        orders.push({ id: orderId, seatId: seat.id, category, price: pricePerUnit })
      }

      // Mark all booked seats as 'sold'
      await client.query(
        `UPDATE seats SET status = 'sold', locked_by = NULL, lock_expires_at = NULL, updated_at = NOW()
         WHERE event_id = $1 AND id IN (${placeholders})`,
        [eventId, ...seatIds]
      )

      await client.query('COMMIT')

      // Broadcast seat sold events via WebSocket (after commit)
      for (const seatId of seatIds) {
        const seatRes = await query('SELECT * FROM seats WHERE id = $1', [seatId])
        if (seatRes.rows[0]) {
          emitSeatSold(seatRes.rows[0], eventId)
        }
      }

      return {
        groupBookingId,
        orders,
        totalAmount,
        itemCount: seatIds.length
      }
    } catch (err) {
      await client.query('ROLLBACK')
      logger.error('Error creating group order for seated event', { err, eventId, userId })
      throw err
    } finally {
      client.release()
    }
  }
}

/**
 * GENERAL event ticketing strategy
 * Handles quantity-based ticket booking with tier support
 */
export const generalTicketing = {
  async validateTicketAvailability(eventId: string | number, quantity: number, category: string = 'NORMAL') {
    // Get event capacity and sold count
    const eventRes = await query('SELECT total_capacity FROM events WHERE id = $1', [eventId])
    const { total_capacity } = eventRes.rows[0]

    const soldRes = await query(
      'SELECT SUM(ticket_count) as sold FROM orders WHERE event_id = $1 AND payment_status = $2',
      [eventId, 'paid']
    )
    const sold = parseInt(soldRes.rows[0]?.sold || 0)
    const remaining = total_capacity - sold

    return {
      isAvailable: remaining >= quantity,
      remaining,
      requested: quantity,
      totalCapacity: total_capacity,
      sold
    }
  },

  async holdTickets(eventId: string | number, quantity: number, category: string = 'NORMAL', userId: string | number) {
    const validation = await this.validateTicketAvailability(eventId, quantity, category)
    if (!validation.isAvailable) {
      throw new ApiError(409, `Only ${validation.remaining} ${category} tickets available`)
    }

    // For general events, we don't lock individual seats, but we track the reservation
    const ticketIds = Array.from({ length: quantity }, (_, i) => `ticket_${Date.now()}_${i}`)
    const groupLockId = await groupLockService.acquireGroupLock(eventId, ticketIds, String(userId), 'ticket')

    if (!groupLockId) {
      throw new ApiError(409, 'Could not reserve tickets. Please try again.')
    }

    return { groupLockId, reservedTickets: ticketIds }
  },

  async releaseTickets(eventId: string | number, groupLockId: string, userId: string | number) {
    if (groupLockId) {
      await groupLockService.releaseGroupLock(groupLockId, String(userId))
    }
  },

  async createGroupOrder(eventId: string | number, userId: string | number, quantity: number, category: string = 'NORMAL', paymentStatus: string = 'pending') {
    const client = await getClient()
    try {
      await client.query('BEGIN')

      // Get event pricing
      const eventRes = await client.query(
        'SELECT price_normal, price_premium FROM events WHERE id = $1',
        [eventId]
      )
      const { price_normal, price_premium } = eventRes.rows[0]
      const pricePerUnit = category === 'PREMIUM' ? price_premium : price_normal
      const totalAmount = pricePerUnit * quantity

      // Create group booking record FIRST (orders FK references this)
      const groupBookingId = uuidv4()
      const orderId = uuidv4()

      await client.query(
        `INSERT INTO group_bookings (id, user_id, event_id, total_amount, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [groupBookingId, userId, eventId, totalAmount, paymentStatus === 'paid' ? 'completed' : 'pending']
      )

      // Now create the order
      await client.query(
        `INSERT INTO orders (id, event_id, user_id, group_booking_id, ticket_count, category, price_per_unit, total_amount, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orderId, eventId, userId, groupBookingId, quantity, category, pricePerUnit, totalAmount, paymentStatus]
      )

      await client.query('COMMIT')

      return {
        groupBookingId,
        orders: [{ id: orderId, ticketCount: quantity, category, pricePerUnit, totalAmount }],
        totalAmount,
        itemCount: 1 // Single order for all tickets
      }
    } catch (err) {
      await client.query('ROLLBACK')
      logger.error('Error creating group order for general event', { err, eventId, userId })
      throw err
    } finally {
      client.release()
    }
  }
}

function isSeatedBooking(items: BookingItems): items is SeatedBookingItems {
  return items !== null && typeof items === 'object' && 'seats' in items;
}

/**
 * Main booking orchestrator - routes to appropriate strategy
 */
export const bookingService = {
  async validateBooking(eventId: string | number, bookingItems: BookingItems): Promise<ValidationResult> {
    // bookingItems: { seats: [id1, id2, ...] } or { quantity, category }
    const eventRes = await query('SELECT v.type AS event_type FROM events e JOIN venues v ON e.venue_id = v.id WHERE e.id = $1', [eventId])
    const { event_type } = eventRes.rows[0]

    if (event_type === 'SEATED') {
      if (!isSeatedBooking(bookingItems)) {
        throw new ApiError(400, 'Invalid booking items for seated event')
      }
      return seatedBooking.validateAvailability(eventId, bookingItems.seats || [])
    } else {
      if (isSeatedBooking(bookingItems)) {
        throw new ApiError(400, 'Invalid booking items for general event')
      }
      return generalTicketing.validateTicketAvailability(eventId, bookingItems.quantity, bookingItems.category)
    }
  },

  async holdBooking(eventId: string | number, userId: string | number, bookingItems: BookingItems): Promise<HoldResult> {
    const eventRes = await query('SELECT v.type AS event_type FROM events e JOIN venues v ON e.venue_id = v.id WHERE e.id = $1', [eventId])
    const { event_type } = eventRes.rows[0]

    if (event_type === 'SEATED') {
      if (!isSeatedBooking(bookingItems)) {
        throw new ApiError(400, 'Invalid booking items for seated event')
      }
      return seatedBooking.holdMultipleSeats(eventId, bookingItems.seats, userId)
    } else {
      if (isSeatedBooking(bookingItems)) {
        throw new ApiError(400, 'Invalid booking items for general event')
      }
      return generalTicketing.holdTickets(eventId, bookingItems.quantity, bookingItems.category, userId)
    }
  },

  async releaseBooking(eventId: string | number, userId: string | number, groupLockId: string, bookingItems?: BookingItems) {
    const eventRes = await query('SELECT v.type AS event_type FROM events e JOIN venues v ON e.venue_id = v.id WHERE e.id = $1', [eventId])
    const { event_type } = eventRes.rows[0]

    if (event_type === 'SEATED') {
      if (!bookingItems || !isSeatedBooking(bookingItems)) {
        throw new ApiError(400, 'Invalid booking items for seated event')
      }
      return seatedBooking.releaseSeats(eventId, bookingItems.seats, userId, groupLockId)
    } else {
      return generalTicketing.releaseTickets(eventId, groupLockId, userId)
    }
  },

  async createGroupBooking(eventId: string | number, userId: string | number, bookingItems: BookingItems, paymentStatus: string = 'pending'): Promise<GroupBookingResult> {
    const eventRes = await query('SELECT v.type AS event_type FROM events e JOIN venues v ON e.venue_id = v.id WHERE e.id = $1', [eventId])
    const { event_type } = eventRes.rows[0]

    if (event_type === 'SEATED') {
      if (!isSeatedBooking(bookingItems)) {
        throw new ApiError(400, 'Invalid booking items for seated event')
      }
      return seatedBooking.createGroupOrder(eventId, userId, bookingItems.seats, paymentStatus)
    } else {
      if (isSeatedBooking(bookingItems)) {
        throw new ApiError(400, 'Invalid booking items for general event')
      }
      return generalTicketing.createGroupOrder(eventId, userId, bookingItems.quantity, bookingItems.category, paymentStatus)
    }
  }
}
