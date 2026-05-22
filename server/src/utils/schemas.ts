import { z } from 'zod'

// 1. Auth Schemas
export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

// 2. Venue Schemas
export const createVenueSchema = z.object({
  name: z.string().trim().min(1, 'Venue name is required'),
  type: z.enum(['SEATED', 'GENERAL']),
  rows: z.coerce.number().int().min(1).max(20).optional().nullable(),
  cols: z.coerce.number().int().min(1).max(30).optional().nullable(),
  totalCapacity: z.coerce.number().int().min(1).optional().nullable(),
  defaultPremiumRows: z.array(z.number()).optional().default([])
}).refine(data => {
  if (data.type === 'SEATED') {
    return data.rows !== undefined && data.rows !== null && data.cols !== undefined && data.cols !== null
  }
  return true
}, {
  message: 'Rows and columns are required for seated venues',
  path: ['rows']
})

// 3. Event Schemas
export const createEventSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required'),
  date: z.string().refine(val => {
    const d = new Date(val)
    return !isNaN(d.getTime()) && d > new Date()
  }, {
    message: 'Event date must be a valid future date'
  }),
  organiser: z.string().trim().optional(),
  priceNormal: z.coerce.number().min(10, 'Normal price must be at least 10').default(100),
  pricePremium: z.coerce.number().min(10).optional(),
  venueId: z.coerce.string().min(1, 'Venue ID is required'),
  pricingRules: z.array(z.any()).optional().default([])
})

// 4. Order/Booking Schemas
export const bookingItemsSchema = z.union([
  z.object({
    seats: z.array(z.union([z.string(), z.number()]))
  }),
  z.object({
    category: z.string().optional(),
    quantity: z.coerce.number().int().min(1)
  })
])

// 4. Order/Booking Schemas
export const holdBookingSchema = z.object({
  eventId: z.coerce.string().min(1, 'Event ID is required'),
  bookingItems: bookingItemsSchema
})

export const releaseBookingSchema = z.object({
  eventId: z.coerce.string().min(1, 'Event ID is required'),
  groupLockId: z.string().min(1, 'Group lock ID is required'),
  bookingItems: bookingItemsSchema.optional()
})

export const createGroupBookingSchema = z.object({
  eventId: z.coerce.string().min(1, 'Event ID is required'),
  bookingItems: bookingItemsSchema,
  groupLockId: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional().default('pending'),
  addonItems: z.array(
    z.object({
      addonId: z.coerce.string(),
      quantity: z.coerce.number().int().min(1)
    })
  ).optional().default([]),
  promoCode: z.string().trim().optional()
})

// 5. Additional Elevated Schemas
export const editEventSchema = z.object({
  name: z.string().trim().min(1).optional(),
  date: z.string().refine(val => {
    const d = new Date(val)
    return !isNaN(d.getTime()) && d > new Date()
  }, {
    message: 'Event date must be a valid future date'
  }).optional(),
  priceNormal: z.coerce.number().min(10).optional(),
  pricePremium: z.coerce.number().min(10).optional()
})

export const resizeGridSchema = z.object({
  rows: z.coerce.number().int().min(1).max(50),
  cols: z.coerce.number().int().min(1).max(50)
})

export const createAddonSchema = z.object({
  name: z.string().trim().min(1, 'Add-on name is required'),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be a non-negative number'),
  maxQuantity: z.coerce.number().int().min(1).optional().nullable()
})

export const updateAddonSchema = z.object({
  name: z.string().trim().min(1, 'Add-on name is required'),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be a non-negative number'),
  maxQuantity: z.coerce.number().int().min(1).optional().nullable()
})

export const createPromoCodeSchema = z.object({
  code: z.string().trim().min(1, 'Promo code is required'),
  discountType: z.enum(['pct', 'fixed']),
  discountValue: z.coerce.number().min(0.01, 'Discount value must be positive'),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  expiresAt: z.string().optional().nullable()
}).refine(data => {
  if (data.discountType === 'pct') {
    return data.discountValue <= 100
  }
  return true
}, {
  message: 'Percentage discount cannot exceed 100',
  path: ['discountValue']
})

export const validatePromoCodeSchema = z.object({
  eventId: z.coerce.string().min(1, 'Event ID is required'),
  code: z.string().trim().min(1, 'Code is required')
})

