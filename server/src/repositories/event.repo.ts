import { query } from '../config/db.js'

export async function getAllEvents() {
  const res = await query(
    `SELECT e.id, e.name, e.date, e.status, e.organiser, e.created_by, e.price_normal, e.price_premium, e.pricing_rules, e.created_at, e.venue_id,
            v.name as venue_name, v.type as event_type, v.rows, v.cols, v.total_capacity as total_capacity, v.default_premium_rows as premium_rows
     FROM events e
     JOIN venues v ON e.venue_id = v.id
     ORDER BY e.date`,
    []
  )
  return res.rows
}

export async function getEventById(eventId: string) {
  const res = await query(
    `SELECT e.id, e.name, e.date, e.status, e.organiser, e.created_by, e.price_normal, e.price_premium, e.pricing_rules, e.created_at, e.venue_id,
            v.name as venue_name, v.type as event_type, v.rows, v.cols, v.total_capacity as total_capacity, v.default_premium_rows as premium_rows
     FROM events e
     JOIN venues v ON e.venue_id = v.id
     WHERE e.id = $1`,
    [eventId]
  )
  return res.rows[0] || null
}

interface CreateEventInput {
  venueId: string
  name: string
  date: string
  organiser?: string
  priceNormal: number
  pricePremium: number
  createdBy?: string
  pricingRules?: any[]
}

export async function createEvent({ venueId, name, date, organiser, priceNormal, pricePremium, createdBy, pricingRules }: CreateEventInput) {
  const res = await query(
    `INSERT INTO events (venue_id, name, date, organiser, price_normal, price_premium, created_by, pricing_rules)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, venue_id, name, date, organiser, created_by, price_normal, price_premium, pricing_rules, created_at`,
    [venueId, name, date, organiser || null, priceNormal, pricePremium, createdBy || null, JSON.stringify(pricingRules || [])]
  )
  return res.rows[0]
}

export async function updateEventStatus(eventId: string, status: string) {
  const res = await query(
    'UPDATE events SET status = $1 WHERE id = $2 RETURNING *',
    [status, eventId]
  )
  return res.rows[0]
}

export async function deleteEvent(eventId: string) {
  await query('DELETE FROM events WHERE id = $1', [eventId])
}

interface UpdateEventInput {
  name: string
  date: string
  priceNormal: number
  pricePremium: number
}

export async function updateEvent(eventId: string, { name, date, priceNormal, pricePremium }: UpdateEventInput) {
  const res = await query(
    `UPDATE events 
     SET name = $1, date = $2, price_normal = $3, price_premium = $4 
     WHERE id = $5 
     RETURNING *`,
    [name, date, priceNormal, pricePremium, eventId]
  )
  return res.rows[0]
}
