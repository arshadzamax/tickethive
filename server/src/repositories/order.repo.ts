import { getClient, query } from '../config/db.js'

interface CreateOrderInput {
  id: string
  eventId: string
  userId: string
  seatId?: string
  paymentStatus: string
}

export async function createOrder(client: any, { id, eventId, userId, seatId, paymentStatus }: CreateOrderInput) {
  const res = await client.query(
    `INSERT INTO orders (id, event_id, user_id, seat_id, payment_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, event_id, user_id, seat_id, payment_status, created_at`,
    [id, eventId, userId, seatId, paymentStatus]
  )
  return res.rows[0]
}

export async function getOrdersByUser(userId: string) {
  const client = await getClient()
  try {
    const res = await client.query(
      `SELECT o.id, o.event_id, o.user_id, o.group_booking_id, o.seat_id, o.ticket_count, o.category, 
              o.price_per_unit, o.total_amount, o.payment_status, o.created_at,
              e.name AS event_name, v.type AS event_type
       FROM orders o
       JOIN events e ON e.id = o.event_id
       JOIN venues v ON e.venue_id = v.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    )
    return res.rows
  } finally {
    client.release()
  }
}

export async function getOrdersByGroupBooking(groupBookingId: string) {
  const res = await query(
    `SELECT o.id, o.event_id, o.user_id, o.seat_id, o.ticket_count, o.category, 
            o.price_per_unit, o.total_amount, o.payment_status, o.created_at,
            e.name AS event_name, v.type AS event_type
     FROM orders o
     JOIN events e ON e.id = o.event_id
     JOIN venues v ON e.venue_id = v.id
     WHERE o.group_booking_id = $1
     ORDER BY o.created_at DESC`,
    [groupBookingId]
  )
  return res.rows
}

export async function getGroupBookingById(groupBookingId: string) {
  const res = await query(
    'SELECT id, user_id, event_id, total_amount, status, created_at FROM group_bookings WHERE id = $1',
    [groupBookingId]
  )
  return res.rows[0] || null
}

export async function getGroupBookingsByUser(userId: string) {
  const res = await query(
    `SELECT gb.id, gb.user_id, gb.event_id, gb.total_amount, gb.status, gb.created_at,
            e.name AS event_name, v.type AS event_type
     FROM group_bookings gb
     JOIN events e ON e.id = gb.event_id
     JOIN venues v ON e.venue_id = v.id
     WHERE gb.user_id = $1
     ORDER BY gb.created_at DESC`,
    [userId]
  )
  return res.rows
}

export async function updateGroupBookingStatus(groupBookingId: string, status: string) {
  const res = await query(
    'UPDATE group_bookings SET status = $1 WHERE id = $2 RETURNING id, status, user_id, event_id, total_amount, created_at',
    [status, groupBookingId]
  )
  return res.rows[0]
}

export async function getSeatsByGroupBooking(groupBookingId: string) {
  const res = await query(
    `SELECT o.seat_id, s.row, s.number, s.category, o.price_per_unit
     FROM orders o
     JOIN seats s ON s.id = o.seat_id
     WHERE o.group_booking_id = $1
     ORDER BY s.row, s.number`,
    [groupBookingId]
  )
  return res.rows
}
