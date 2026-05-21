import { query } from '../config/db.js'

interface SurgeRule {
  type: 'surge'
  threshold: number
  increase_pct: number
}

interface EarlyBirdRule {
  type: 'early_bird'
  ends_at: string
  discount_pct: number
}

type PricingRule = SurgeRule | EarlyBirdRule

interface AppliedRule {
  type: string
  label: string
}

export async function getEffectivePrice(eventId: string) {
  // Fetch base prices, rules, and capacity
  const eventRes = await query(
    `SELECT e.price_normal, e.price_premium, e.pricing_rules,
            v.total_capacity, v.type AS event_type
     FROM events e
     JOIN venues v ON e.venue_id = v.id
     WHERE e.id = $1`,
    [eventId]
  )
  if (!eventRes.rows[0]) return null

  const { price_normal, price_premium, pricing_rules, total_capacity, event_type } = eventRes.rows[0]
  const rules: PricingRule[] = Array.isArray(pricing_rules) ? pricing_rules : (pricing_rules ? JSON.parse(pricing_rules) : [])

  let multiplier = 1.0
  const appliedRules: AppliedRule[] = []

  for (const rule of rules) {
    if (rule.type === 'surge') {
      // Count sold seats/tickets as % of capacity
      let soldCount = 0
      if (event_type === 'SEATED') {
        const soldRes = await query(
          `SELECT COUNT(*) AS cnt FROM seats WHERE event_id = $1 AND status = 'sold'`,
          [eventId]
        )
        soldCount = parseInt(soldRes.rows[0]?.cnt || 0)
      } else {
        const soldRes = await query(
          `SELECT COALESCE(SUM(ticket_count), 0) AS cnt FROM orders WHERE event_id = $1 AND payment_status = 'paid'`,
          [eventId]
        )
        soldCount = parseInt(soldRes.rows[0]?.cnt || 0)
      }

      const capacity = total_capacity || 1
      const pctSold = (soldCount / capacity) * 100

      if (pctSold >= rule.threshold) {
        const surge = 1 + (rule.increase_pct / 100)
        multiplier *= surge
        appliedRules.push({
          type: 'surge',
          label: `🔥 Surge pricing active — ${rule.increase_pct}% increase (${Math.round(pctSold)}% sold)`,
        })
      }
    }

    if (rule.type === 'early_bird') {
      const now = new Date()
      const endsAt = new Date(rule.ends_at)
      if (now < endsAt) {
        const discount = 1 - (rule.discount_pct / 100)
        multiplier *= discount
        appliedRules.push({
          type: 'early_bird',
          label: `🐦 Early bird discount — ${rule.discount_pct}% off (ends ${endsAt.toLocaleDateString()})`,
        })
      }
    }
  }

  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    normalPrice: round2(Number(price_normal) * multiplier),
    premiumPrice: round2(Number(price_premium) * multiplier),
    baseNormalPrice: Number(price_normal),
    basePremiumPrice: Number(price_premium),
    multiplier: round2(multiplier),
    appliedRules,
    hasPriceChange: appliedRules.length > 0,
  }
}
