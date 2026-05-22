export interface Seat {
  id: string
  event_id: string
  row: number
  number: number
  status: 'available' | 'locked' | 'sold'
  locked_by: string | null
  lock_expires_at: string | Date | null
  admin_locked: boolean
  created_at?: string | Date
  updated_at?: string | Date
}

export interface Venue {
  id: string
  name: string
  type: 'SEATED' | 'GENERAL'
  rows: number | null
  cols: number | null
  total_capacity: number | null
  default_premium_rows: number[]
  created_at?: string | Date
}

export interface PricingRule {
  rowStart: number
  rowEnd: number
  price: number
}

export interface Event {
  id: string
  venue_id: string
  name: string
  date: string | Date
  status: 'active' | 'cancelled' | 'draft'
  organiser: string | null
  created_by: string | null
  price_normal: number
  price_premium: number | null
  pricing_rules: PricingRule[]
  created_at?: string | Date
}

export interface Order {
  id: string
  event_id: string
  user_id: string
  group_booking_id: string | null
  seat_id: string | null
  ticket_count: number | null
  category: string | null
  price_per_unit: number
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
  created_at?: string | Date
}

export interface GroupBooking {
  id: string
  user_id: string
  event_id: string
  total_amount: number
  status: 'pending' | 'paid' | 'failed'
  created_at?: string | Date
}

export interface Addon {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  max_quantity: number | null
  created_at?: string | Date
}

export interface PromoCode {
  id: string
  event_id: string
  created_by: string | null
  code: string
  discount_type: 'pct' | 'fixed'
  discount_value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  created_at?: string | Date
}
