import { query } from '../config/db.js'

export async function getAllVenues() {
  const res = await query(
    'SELECT id, name, type, rows, cols, total_capacity, default_premium_rows, created_at FROM venues ORDER BY name',
    []
  )
  return res.rows
}

export async function getVenueById(venueId: string) {
  const res = await query(
    'SELECT id, name, type, rows, cols, total_capacity, default_premium_rows, created_at FROM venues WHERE id = $1',
    [venueId]
  )
  return res.rows[0] || null
}

interface CreateVenueInput {
  name: string
  type: string
  rows?: number | null
  cols?: number | null
  totalCapacity: number
  defaultPremiumRows?: any[]
}

export async function createVenue({ name, type, rows, cols, totalCapacity, defaultPremiumRows }: CreateVenueInput) {
  const res = await query(
    `INSERT INTO venues (name, type, rows, cols, total_capacity, default_premium_rows)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, type, rows, cols, total_capacity, default_premium_rows, created_at`,
    [name, type, rows, cols, totalCapacity, JSON.stringify(defaultPremiumRows || [])]
  )
  return res.rows[0]
}
