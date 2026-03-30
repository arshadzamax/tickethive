import { query } from '../config/db.js'

export async function getAllEvents() {
  const res = await query(
    'SELECT id, name, date, venue_layout, organiser, created_at FROM events ORDER BY date',
    []
  )
  return res.rows
}

export async function getEventById(eventId) {
  const res = await query(
    'SELECT id, name, date, venue_layout, organiser, created_at FROM events WHERE id = $1',
    [eventId]
  )
  return res.rows[0] || null
}

export async function createEvent({ name, date, venueLayout, organiser }) {
  const res = await query(
    `INSERT INTO events (name, date, venue_layout, organiser)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, date, venue_layout, organiser, created_at`,
    [name, date, venueLayout || '{}', organiser || null]
  )
  return res.rows[0]
}
