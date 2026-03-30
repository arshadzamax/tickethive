import { getClient } from '../config/db.js'

export async function createOrder(client, { id, eventId, userId, seatId, paymentStatus }) {
  const res = await client.query(
    `INSERT INTO orders (id, event_id, user_id, seat_id, payment_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, event_id, user_id, seat_id, payment_status, created_at`,
    [id, eventId, userId, seatId, paymentStatus]
  )
  return res.rows[0]
}

export async function getOrdersByUser(userId) {
  const client = await getClient()
  try {
    const res = await client.query(
      `SELECT o.id, o.event_id, o.user_id, o.seat_id, o.payment_status, o.created_at,
              e.name AS event_name
       FROM orders o
       JOIN events e ON e.id = o.event_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    )
    return res.rows
  } finally {
    client.release()
  }
}
