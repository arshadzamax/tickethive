export type ApiErrorPayload = {
  message: string
  [key: string]: unknown
}

export type ErrorResponse = ApiErrorPayload

export interface User {
  id: string
  email?: string
  created_at?: string
  role?: 'admin' | 'user' | string
  [key: string]: unknown
}

export interface AuthResponse {
  user: User
  token: string
}

export interface Event {
  id: string | number
  name?: string
  date?: string
  organiser?: string
  [key: string]: unknown
}

export interface Venue {
  id: string | number
  name: string
  type: 'SEATED' | 'GENERAL' | string
  rows?: number
  cols?: number
  defaultPremiumRows?: number[]
  total_capacity?: number
  totalCapacity?: number
  [key: string]: unknown
}

export interface Seat {
  id: string | number
  status: string
  lockedBy: string | null
  lockExpiresAt: number | null
  adminLocked?: boolean
  admin_locked?: boolean
  category?: string
  row: string | number
  number: string | number
  premium?: boolean
  [key: string]: unknown
}

export type SeatedBookingItems = {
  seats: Array<string | number>
}

export type GeneralBookingItems = {
  quantity: number
  category: string
}

export type BookingItems = SeatedBookingItems | GeneralBookingItems

export interface AddonItem {
  addonId: string
  name: string
  quantity: number
  pricePerUnit: number
}

export interface PromoValidation {
  valid: boolean
  discountType: 'pct' | 'flat' | string
  discountValue: number
  code: string
}

export type SelectedItems = Array<string | number> | { quantity: number; category: string }

export interface BookingState {
  bookingStatus: 'idle' | 'loading' | 'success' | 'failed'
  error: string | null
  selectedItems: SelectedItems
  groupLockId: string | null
  holdingStatus: 'idle' | 'loading' | 'success' | 'failed'
  creatingStatus: 'idle' | 'loading' | 'success' | 'failed'
  currentGroupBooking: unknown
  totalPrice: number
  eventType: 'SEATED' | 'GENERAL' | null
  addonItems: AddonItem[]
  promoCode: string
  promoValidation: PromoValidation | null
  discountAmount: number
}

export interface AdminState {
  stats: unknown
  loading: boolean
  actionLoading: boolean
  error: string | null
  actionMessage: string | null
}

export interface EventsState {
  events: Event[]
  loading: boolean
  error: string | null
  creating: boolean
  createError: string | null
}

export interface VenuesState {
  list: unknown[]
  loading: boolean
  error: string | null
  creating: boolean
  createError: string | null
}

export interface SeatsState {
  seats: Seat[]
  selectedSeat: Seat | null
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  initialized: boolean
}

// Component Props Types
export interface EffectivePrices {
  normalPrice?: number
  premiumPrice?: number
}

export interface BookingCartProps {
  event: Event & { price_normal?: number; price_premium?: number; premium_rows?: number[] }
  eventType: 'SEATED' | 'GENERAL' | null
  effectivePrices?: EffectivePrices
}

export interface GeneralTicketBookingProps {
  event: Event
  eventType: 'SEATED' | 'GENERAL' | null
  premiumPrice: number
  normalPrice: number
}

export interface MultiSeatSelectorProps {
  eventId?: string | number
  eventType: 'SEATED' | 'GENERAL' | null
  premiumPrice: number
  normalPrice: number
  premiumRows?: number[]
}

export interface ScrollRevealProps {
  children: React.ReactNode
}

export interface CursorGlowProps {
  enabled?: boolean
}

export interface LiveEventsSectionProps {
  limit?: number
}
