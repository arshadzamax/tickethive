import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as promoRepo from '../repositories/promo.repo.js'
import * as eventRepo from '../repositories/event.repo.js'
import ApiError from '../utils/ApiError.js'

const router = Router()

/** GET /api/events/:id/promo-codes — organizer only */
router.get('/events/:id/promo-codes', auth, async (req, res, next) => {
  try {
    const event = await eventRepo.getEventById(req.params.id)
    if (!event) throw new ApiError(404, 'Event not found')
    if (event.created_by !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const codes = await promoRepo.getPromoCodesByEvent(req.params.id)
    res.json(codes)
  } catch (err) { next(err) }
})

/** POST /api/events/:id/promo-codes — organizer only */
router.post('/events/:id/promo-codes', auth, async (req, res, next) => {
  try {
    const event = await eventRepo.getEventById(req.params.id)
    if (!event) throw new ApiError(404, 'Event not found')
    if (event.created_by !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const { code, discountType, discountValue, maxUses, expiresAt } = req.body
    if (!code?.trim()) throw new ApiError(400, 'Code is required')
    if (!['pct', 'fixed'].includes(discountType)) throw new ApiError(400, 'discountType must be pct or fixed')
    if (!discountValue || isNaN(discountValue) || discountValue <= 0) {
      throw new ApiError(400, 'discountValue must be a positive number')
    }
    if (discountType === 'pct' && discountValue > 100) {
      throw new ApiError(400, 'Percentage discount cannot exceed 100')
    }

    const promo = await promoRepo.createPromoCode({
      eventId: req.params.id,
      createdBy: req.user.id,
      code: code.trim(),
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
    })
    res.status(201).json(promo)
  } catch (err) { next(err) }
})

/** DELETE /api/events/:id/promo-codes/:codeId — organizer only */
router.delete('/events/:id/promo-codes/:codeId', auth, async (req, res, next) => {
  try {
    const event = await eventRepo.getEventById(req.params.id)
    if (!event) throw new ApiError(404, 'Event not found')
    if (event.created_by !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    await promoRepo.deletePromoCode(req.params.codeId)
    res.status(204).end()
  } catch (err) { next(err) }
})

/** POST /api/promo-codes/validate — any authenticated user */
router.post('/promo-codes/validate', auth, async (req, res, next) => {
  try {
    const { eventId, code } = req.body
    if (!eventId || !code) throw new ApiError(400, 'eventId and code are required')
    const result = await promoRepo.validatePromoCode(eventId, code)
    res.json(result)
  } catch (err) { next(err) }
})

export default router
