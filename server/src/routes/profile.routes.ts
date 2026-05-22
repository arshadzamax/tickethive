import { Router, Request, Response, NextFunction } from 'express'
import auth from '../middleware/auth.js'
import { query } from '../config/db.js'
import { requireUser } from '../utils/params.js'
import type { ApiResponse } from '../types/response.js'

const router = Router()

/**
 * GET /api/profile
 * Returns aggregated profile data for the authenticated user
 */
router.get('/profile', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUser(req).id
    const userRes = await query('SELECT email, role, created_at FROM users WHERE id = $1', [userId])
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    const dbUser = userRes.rows[0]
    const userEmail = dbUser.email
    const userRole = dbUser.role
    const userName = userEmail.split('@')[0]

    // Get all group bookings with event info
    const bookingsRes = await query(
      `SELECT gb.id, gb.event_id, gb.total_amount, gb.status, gb.created_at,
              e.name AS event_name, e.date AS event_date, v.type AS event_type, e.organiser
       FROM group_bookings gb
       JOIN events e ON e.id = gb.event_id
       JOIN venues v ON e.venue_id = v.id
       WHERE gb.user_id = $1
       ORDER BY gb.created_at DESC`,
      [userId]
    )

    // Get all individual orders for seat details
    const ordersRes = await query(
      `SELECT o.id, o.event_id, o.group_booking_id, o.seat_id, o.ticket_count, o.category,
              o.price_per_unit, o.total_amount, o.payment_status, o.created_at,
              e.name AS event_name, e.date AS event_date, v.type AS event_type,
              s.row AS seat_row, s.number AS seat_number
       FROM orders o
       JOIN events e ON e.id = o.event_id
       JOIN venues v ON e.venue_id = v.id
       LEFT JOIN seats s ON s.id = o.seat_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    )

    // Get events hosted by this user (match by created_by user id)
    const hostedRes = await query(
      `SELECT e.id, e.name, e.date, e.status, v.type AS event_type, e.organiser, e.price_normal, e.price_premium, v.total_capacity, e.created_at
       FROM events e
       JOIN venues v ON e.venue_id = v.id
       WHERE e.created_by = $1
       ORDER BY e.date DESC`,
      [userId]
    )

    // Calculate stats
    const totalSpent = bookingsRes.rows.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
    const completedBookings = bookingsRes.rows.filter(b => b.status === 'completed' || b.status === 'pending').length
    const uniqueEvents = new Set(bookingsRes.rows.map(b => b.event_id)).size

    // Events attended (past events with confirmed bookings)
    const now = new Date()
    const eventsAttended = bookingsRes.rows.filter(b => new Date(b.event_date) < now).length

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: userEmail,
          role: userRole,
          memberSince: dbUser.created_at
        },
        stats: {
          totalBookings: bookingsRes.rows.length,
          completedBookings,
          totalSpent,
          uniqueEvents,
          eventsAttended,
          eventsHosted: hostedRes.rows.length,
          totalOrders: ordersRes.rows.length
        },
        bookings: bookingsRes.rows,
        orders: ordersRes.rows,
        hostedEvents: hostedRes.rows
      }
    } satisfies ApiResponse<any>)
  } catch (err) {
    next(err)
  }
})

export default router
