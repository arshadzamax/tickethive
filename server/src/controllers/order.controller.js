import * as orderRepo from '../repositories/order.repo.js'
import * as bookingStrategy from '../services/bookingStrategy.service.js'
import * as groupLockService from '../services/groupLock.service.js'
import * as addonRepo from '../repositories/addon.repo.js'
import * as promoRepo from '../repositories/promo.repo.js'
import { getClient } from '../config/db.js'
import ApiError from '../utils/ApiError.js'

export async function listOrders(req, res, next) {
  try {
    const userId = req.user.id
    const orders = await orderRepo.getOrdersByUser(userId)
    res.json(orders)
  } catch (err) {
    next(err)
  }
}

/**
 * Hold/reserve seats or tickets for a group booking
 */
export async function holdBooking(req, res, next) {
  try {
    const userId = req.user.id
    const { eventId, bookingItems } = req.body

    if (!eventId) throw new ApiError(400, 'Event ID is required')
    if (!bookingItems) throw new ApiError(400, 'Booking items required')

    // Validate booking
    const validation = await bookingStrategy.bookingService.validateBooking(eventId, bookingItems)
    if (!validation.allAvailable && !validation.isAvailable) {
      throw new ApiError(409, 'Items not available')
    }

    // Hold booking
    const holdResult = await bookingStrategy.bookingService.holdBooking(eventId, userId, bookingItems)

    res.json({
      success: true,
      groupLockId: holdResult.groupLockId,
      lockedItems: holdResult.lockedSeats || holdResult.reservedTickets,
      message: 'Booking held successfully'
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Release a held booking
 */
export async function releaseBooking(req, res, next) {
  try {
    const userId = req.user.id
    const { eventId, groupLockId, bookingItems } = req.body

    if (!eventId || !groupLockId) throw new ApiError(400, 'Event ID and group lock ID required')

    await bookingStrategy.bookingService.releaseBooking(eventId, userId, groupLockId, bookingItems)

    res.json({ success: true, message: 'Booking released' })
  } catch (err) {
    next(err)
  }
}

/**
 * Create a group booking (multiple seats/tickets in one order)
 */
export async function createGroupBooking(req, res, next) {
  try {
    const userId = req.user.id
    const { eventId, bookingItems, groupLockId, paymentStatus, addonItems, promoCode } = req.body

    if (!eventId) throw new ApiError(400, 'Event ID is required')
    if (!bookingItems) throw new ApiError(400, 'Booking items required')

    // --- Validate promo code upfront (before any DB writes) ---
    let promoValidation = null
    if (promoCode) {
      promoValidation = await promoRepo.validatePromoCode(eventId, promoCode)
      if (!promoValidation.valid) {
        throw new ApiError(400, promoValidation.reason)
      }
    }

    // Create the core group booking (seats/tickets)
    const result = await bookingStrategy.bookingService.createGroupBooking(
      eventId,
      userId,
      bookingItems,
      paymentStatus || 'pending'
    )

    // --- Post-creation: add-ons + promo in a single transaction ---
    if ((addonItems?.length > 0) || promoValidation) {
      const client = await getClient()
      try {
        await client.query('BEGIN')

        let addonTotal = 0
        let discountAmount = 0

        // Write add-ons
        if (addonItems?.length > 0) {
          addonTotal = await addonRepo.createOrderAddons(client, result.groupBookingId, addonItems)
        }

        // Apply promo discount to ticket subtotal only
        if (promoValidation) {
          const ticketSubtotal = Number(result.totalAmount)
          if (promoValidation.discountType === 'pct') {
            discountAmount = Math.round((ticketSubtotal * promoValidation.discountValue / 100) * 100) / 100
          } else {
            discountAmount = Math.min(promoValidation.discountValue, ticketSubtotal)
          }
          await promoRepo.incrementPromoUse(client, promoValidation.promoId)
        }

        const newTotal = Math.max(0, Number(result.totalAmount) + addonTotal - discountAmount)

        // Update group_bookings with final total + promo metadata
        await client.query(
          `UPDATE group_bookings
           SET total_amount=$1, promo_code=$2, discount_amount=$3
           WHERE id=$4`,
          [newTotal, promoCode?.toUpperCase() || null, discountAmount, result.groupBookingId]
        )

        await client.query('COMMIT')
        result.totalAmount = newTotal
        result.addonTotal = addonTotal
        result.discountAmount = discountAmount
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    }

    // Release the lock if provided
    if (groupLockId) {
      try {
        await groupLockService.releaseGroupLock(groupLockId, userId)
      } catch (err) {
        console.warn('Failed to release group lock', err)
      }
    }

    res.status(201).json({
      success: true,
      ...result,
      message: `Group booking created with ${result.itemCount} item(s)`
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Get group booking details
 */
export async function getGroupBooking(req, res, next) {
  try {
    const userId = req.user.id
    const { groupBookingId } = req.params

    const groupBooking = await orderRepo.getGroupBookingById(groupBookingId)
    if (!groupBooking) throw new ApiError(404, 'Group booking not found')
    if (groupBooking.user_id !== userId) throw new ApiError(403, 'Unauthorized')

    const orders = await orderRepo.getOrdersByGroupBooking(groupBookingId)

    res.json({
      groupBooking,
      orders,
      itemCount: orders.length,
      totalAmount: groupBooking.total_amount
    })
  } catch (err) {
    next(err)
  }
}

/**
 * List user's group bookings
 */
export async function listGroupBookings(req, res, next) {
  try {
    const userId = req.user.id
    const groupBookings = await orderRepo.getGroupBookingsByUser(userId)
    res.json(groupBookings)
  } catch (err) {
    next(err)
  }
}