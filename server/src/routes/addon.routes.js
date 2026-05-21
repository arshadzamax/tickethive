import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as addonRepo from '../repositories/addon.repo.js'
import * as eventRepo from '../repositories/event.repo.js'
import ApiError from '../utils/ApiError.js'

const router = Router()

/** GET /api/events/:id/addons — public */
router.get('/events/:id/addons', async (req, res, next) => {
  try {
    const addons = await addonRepo.getAddonsByEvent(req.params.id)
    res.json(addons)
  } catch (err) { next(err) }
})

/** POST /api/events/:id/addons — organizer only */
router.post('/events/:id/addons', auth, async (req, res, next) => {
  try {
    const event = await eventRepo.getEventById(req.params.id)
    if (!event) throw new ApiError(404, 'Event not found')
    if (event.created_by !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const { name, description, price, maxQuantity } = req.body
    if (!name?.trim()) throw new ApiError(400, 'Add-on name is required')
    if (price == null || isNaN(price) || price < 0) throw new ApiError(400, 'Valid price is required')

    const addon = await addonRepo.createAddon({
      eventId: req.params.id,
      name: name.trim(),
      description: description?.trim() || null,
      price: Number(price),
      maxQuantity: maxQuantity ? Number(maxQuantity) : null,
    })
    res.status(201).json(addon)
  } catch (err) { next(err) }
})

/** PUT /api/events/:id/addons/:addonId — organizer only */
router.put('/events/:id/addons/:addonId', auth, async (req, res, next) => {
  try {
    const event = await eventRepo.getEventById(req.params.id)
    if (!event) throw new ApiError(404, 'Event not found')
    if (event.created_by !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const { name, description, price, maxQuantity } = req.body
    const updated = await addonRepo.updateAddon(req.params.addonId, {
      name: name?.trim(),
      description: description?.trim() || null,
      price: Number(price),
      maxQuantity: maxQuantity ? Number(maxQuantity) : null,
    })
    if (!updated) throw new ApiError(404, 'Add-on not found')
    res.json(updated)
  } catch (err) { next(err) }
})

/** DELETE /api/events/:id/addons/:addonId — organizer only */
router.delete('/events/:id/addons/:addonId', auth, async (req, res, next) => {
  try {
    const event = await eventRepo.getEventById(req.params.id)
    if (!event) throw new ApiError(404, 'Event not found')
    if (event.created_by !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const addon = await addonRepo.getAddonById(req.params.addonId)
    if (!addon) throw new ApiError(404, 'Add-on not found')
    await addonRepo.deleteAddon(req.params.addonId)
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
