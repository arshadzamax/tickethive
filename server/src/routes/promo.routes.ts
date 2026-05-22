import { Router, Request, Response, NextFunction } from 'express'
import auth from '../middleware/auth.js'
import * as promoRepo from '../repositories/promo.repo.js'
import * as eventRepo from '../repositories/event.repo.js'
import ApiError from '../utils/ApiError.js'
import { requireUser, getParamAsString } from '../utils/params.js'
import type { ApiResponse } from '../types/response.js'
import { createPromoCodeSchema, validatePromoCodeSchema } from '../utils/schemas.js'

const router = Router()

/** GET /api/events/:id/promo-codes — organizer only */
router.get('/events/:id/promo-codes', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventRepo.getEventById(getParamAsString(req, 'id'))
    if (!event) throw new ApiError(404, 'Event not found')
    const currentUser = requireUser(req)
    if (event.created_by !== String(currentUser.id) && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const codes = await promoRepo.getPromoCodesByEvent(getParamAsString(req, 'id'))
    res.json({ success: true, data: codes } satisfies ApiResponse<typeof codes>)
  } catch (err) { next(err) }
})

/** POST /api/events/:id/promo-codes — organizer only */
router.post('/events/:id/promo-codes', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventRepo.getEventById(getParamAsString(req, 'id'))
    if (!event) throw new ApiError(404, 'Event not found')
    const currentUser = requireUser(req)
    if (event.created_by !== String(currentUser.id) && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const { code, discountType, discountValue, maxUses, expiresAt } = createPromoCodeSchema.parse(req.body)

    const promo = await promoRepo.createPromoCode({
      eventId: getParamAsString(req, 'id'),
      createdBy: String(currentUser.id),
      code: code.trim(),
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
    })
    res.status(201).json({ success: true, data: promo } satisfies ApiResponse<typeof promo>)
  } catch (err) { next(err) }
})

/** DELETE /api/events/:id/promo-codes/:codeId — organizer only */
router.delete('/events/:id/promo-codes/:codeId', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventRepo.getEventById(getParamAsString(req, 'id'))
    if (!event) throw new ApiError(404, 'Event not found')
    const currentUser = requireUser(req)
    if (event.created_by !== String(currentUser.id) && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    await promoRepo.deletePromoCode(getParamAsString(req, 'codeId'))
    res.status(204).end()
  } catch (err) { next(err) }
})

/** POST /api/promo-codes/validate — any authenticated user */
router.post('/promo-codes/validate', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, code } = validatePromoCodeSchema.parse(req.body)
    const result = await promoRepo.validatePromoCode(eventId, code)
    res.json({ success: true, data: result } satisfies ApiResponse<typeof result>)
  } catch (err) { next(err) }
})

export default router
