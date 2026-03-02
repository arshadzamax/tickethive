import { getClient } from '../config/db.js'

export async function createOrder(client, { id, userId, seatId, paymentStatus }) {
  const res = await client.query(
    `INSERT INTO orders (id, user_id, seat_id, payment_status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, seat_id, payment_status, created_at`,
    [id, userId, seatId, paymentStatus]
  )
  return res.rows[0]
}

export async function getOrdersByUser(userId) {
  const client = await getClient()
  try {
    const res = await client.query(
      `SELECT id, user_id, seat_id, payment_status, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )
    return res.rows
  } finally {
    client.release()
  }
}

