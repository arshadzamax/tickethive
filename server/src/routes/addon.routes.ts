import { Router, Request, Response, NextFunction } from 'express'
import auth from '../middleware/auth.js'
import * as addonRepo from '../repositories/addon.repo.js'
import * as eventRepo from '../repositories/event.repo.js'
import ApiError from '../utils/ApiError.js'
import { requireUser, getParamAsString } from '../utils/params.js'
import type { ApiResponse } from '../types/response.js'
import { createAddonSchema, updateAddonSchema } from '../utils/schemas.js'

const router = Router()

/** GET /api/events/:id/addons — public */
router.get('/events/:id/addons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addons = await addonRepo.getAddonsByEvent(getParamAsString(req, 'id'))
    res.json({ success: true, data: addons } satisfies ApiResponse<typeof addons>)
  } catch (err) { next(err) }
})

/** POST /api/events/:id/addons — organizer only */
router.post('/events/:id/addons', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventRepo.getEventById(getParamAsString(req, 'id'))
    if (!event) throw new ApiError(404, 'Event not found')
    const currentUser = requireUser(req)
    if (event.created_by !== String(currentUser.id) && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const { name, description, price, maxQuantity } = createAddonSchema.parse(req.body)

    const addon = await addonRepo.createAddon({
      eventId: getParamAsString(req, 'id'),
      name: name.trim(),
      description: description?.trim() || null,
      price: Number(price),
      maxQuantity: maxQuantity ? Number(maxQuantity) : null,
    })
    res.status(201).json({ success: true, data: addon } satisfies ApiResponse<typeof addon>)
  } catch (err) { next(err) }
})

/** PUT /api/events/:id/addons/:addonId — organizer only */
router.put('/events/:id/addons/:addonId', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventRepo.getEventById(getParamAsString(req, 'id'))
    if (!event) throw new ApiError(404, 'Event not found')
    const currentUser = requireUser(req)
    if (event.created_by !== String(currentUser.id) && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const parsed = updateAddonSchema.parse(req.body)
    const updated = await addonRepo.updateAddon(getParamAsString(req, 'addonId'), {
      name: parsed.name,
      description: parsed.description,
      price: parsed.price,
      maxQuantity: parsed.maxQuantity,
    })
    if (!updated) throw new ApiError(404, 'Add-on not found')
    res.json({ success: true, data: updated } satisfies ApiResponse<typeof updated>)
  } catch (err) { next(err) }
})

/** DELETE /api/events/:id/addons/:addonId — organizer only */
router.delete('/events/:id/addons/:addonId', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventRepo.getEventById(getParamAsString(req, 'id'))
    if (!event) throw new ApiError(404, 'Event not found')
    const currentUser = requireUser(req)
    if (event.created_by !== String(currentUser.id) && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const addon = await addonRepo.getAddonById(getParamAsString(req, 'addonId'))
    if (!addon) throw new ApiError(404, 'Add-on not found')
    await addonRepo.deleteAddon(getParamAsString(req, 'addonId'))
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
