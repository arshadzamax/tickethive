import { query } from '../config/db.js'

export async function getPromoCodesByEvent(eventId) {
  const res = await query(
    `SELECT id, event_id, code, discount_type, discount_value, max_uses, uses_count, expires_at, created_at
     FROM promo_codes WHERE event_id=$1 ORDER BY created_at DESC`,
    [eventId]
  )
  return res.rows
}

export async function createPromoCode({ eventId, createdBy, code, discountType, discountValue, maxUses, expiresAt }) {
  const res = await query(
    `INSERT INTO promo_codes (event_id, created_by, code, discount_type, discount_value, max_uses, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, event_id, code, discount_type, discount_value, max_uses, uses_count, expires_at, created_at`,
    [eventId, createdBy, code.toUpperCase(), discountType, discountValue, maxUses || null, expiresAt || null]
  )
  return res.rows[0]
}

export async function deletePromoCode(codeId) {
  await query('DELETE FROM promo_codes WHERE id=$1', [codeId])
}

/**
 * Validate a promo code for an event.
 * Returns { valid, discount, code, reason } 
 */
export async function validatePromoCode(eventId, code) {
  const res = await query(
    `SELECT * FROM promo_codes WHERE event_id=$1 AND code=$2`,
    [eventId, code.toUpperCase()]
  )
  const promo = res.rows[0]

  if (!promo) return { valid: false, reason: 'Invalid promo code' }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, reason: 'Promo code has expired' }
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return { valid: false, reason: 'Promo code usage limit reached' }
  }

  return {
    valid: true,
    promoId: promo.id,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: Number(promo.discount_value),
  }
}

/**
 * Atomically increment uses_count. Call inside a DB transaction.
 */
export async function incrementPromoUse(client, promoId) {
  await client.query(
    'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id=$1',
    [promoId]
  )
}
