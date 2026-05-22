import type { PoolClient } from 'pg'
import { query } from '../config/db.js'

export async function getAddonsByEvent(eventId: string) {
  const res = await query(
    `SELECT id, event_id, name, description, price, max_quantity, created_at
     FROM event_addons WHERE event_id = $1 ORDER BY created_at`,
    [eventId]
  )
  return res.rows
}

interface CreateAddonInput {
  eventId: string
  name: string
  description?: string | null
  price: number
  maxQuantity?: number | null
}

export async function createAddon({ eventId, name, description, price, maxQuantity }: CreateAddonInput) {
  const res = await query(
    `INSERT INTO event_addons (event_id, name, description, price, max_quantity)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, event_id, name, description, price, max_quantity, created_at`,
    [eventId, name, description || null, price, maxQuantity || null]
  )
  return res.rows[0]
}

interface UpdateAddonInput {
  name: string
  description?: string | null
  price: number
  maxQuantity?: number | null
}

export async function updateAddon(addonId: string, { name, description, price, maxQuantity }: UpdateAddonInput) {
  const res = await query(
    `UPDATE event_addons SET name=$1, description=$2, price=$3, max_quantity=$4
     WHERE id=$5 RETURNING id, event_id, name, description, price, max_quantity, created_at`,
    [name, description || null, price, maxQuantity || null, addonId]
  )
  return res.rows[0] || null
}

export async function deleteAddon(addonId: string) {
  await query('DELETE FROM event_addons WHERE id=$1', [addonId])
}

export async function getAddonById(addonId: string) {
  const res = await query(
    'SELECT id, event_id, name, description, price, max_quantity FROM event_addons WHERE id=$1',
    [addonId]
  )
  return res.rows[0] || null
}

interface AddonItem {
  addonId: string
  quantity: number
}

export async function createOrderAddons(client: PoolClient, groupBookingId: string, addonItems: AddonItem[]) {
  let total = 0
  for (const item of addonItems) {
    const { addonId, quantity } = item
    const addonRes = await client.query(
      'SELECT price FROM event_addons WHERE id=$1',
      [addonId]
    )
    if (!addonRes.rows[0]) continue
    const pricePerUnit = Number(addonRes.rows[0].price)
    const lineTotal = pricePerUnit * quantity
    total += lineTotal
    await client.query(
      `INSERT INTO order_addons (group_booking_id, addon_id, quantity, price_per_unit, total)
       VALUES ($1, $2, $3, $4, $5)`,
      [groupBookingId, addonId, quantity, pricePerUnit, lineTotal]
    )
  }
  return total
}
