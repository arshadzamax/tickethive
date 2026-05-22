import type { Request, Response, NextFunction } from 'express'
import * as eventRepo from '../repositories/event.repo.js'
import * as venueRepo from '../repositories/venue.repo.js'
import { query } from '../config/db.js'
import ApiError from '../utils/ApiError.js'
import { getParamAsString, requireUser } from '../utils/params.js'
import { getEffectivePrice } from '../services/pricingEngine.js'
import { createEventSchema, editEventSchema } from '../utils/schemas.js'
import type { ApiResponse } from '../types/response.js'

export async function getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await eventRepo.getAllEvents()
    res.json({ success: true, data: events } satisfies ApiResponse<typeof events>)
  } catch (err) {
    next(err)
  }
}

export async function getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getParamAsString(req, 'id')
    const event = await eventRepo.getEventById(id)
    if (!event) {
      throw new ApiError(404, 'Event not found')
    }
    res.json({ success: true, data: event } satisfies ApiResponse<typeof event>)
  } catch (err) {
    next(err)
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUser = requireUser(req)
    const { name, date, organiser, priceNormal, pricePremium, venueId, pricingRules } = createEventSchema.parse(req.body)

    const normalPrice = priceNormal
    const premiumPrice = pricePremium ?? normalPrice * 1.5

    const venue = await venueRepo.getVenueById(venueId)
    if (!venue) throw new ApiError(404, 'Venue not found')

    const event = await eventRepo.createEvent({
      venueId,
      name,
      date,
      organiser: organiser || 'Organiser',
      priceNormal: normalPrice,
      pricePremium: premiumPrice,
      createdBy: String(currentUser.id),
      pricingRules,
    })


    if (venue.type === 'SEATED') {
      const gridRows = venue.rows || 5
      const gridCols = venue.cols || 10
      const premiumRowsArray = typeof venue.default_premium_rows === 'string' 
        ? JSON.parse(venue.default_premium_rows || '[]') 
        : (venue.default_premium_rows || [])

      // Auto-seed seats for the new event based on venue layout
      for (let r = 1; r <= gridRows; r++) {
        const category = premiumRowsArray.includes(r) ? 'PREMIUM' : 'NORMAL'
        for (let n = 1; n <= gridCols; n++) {
          await query(
            'INSERT INTO seats (event_id, row, number, category) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [event.id, r, n, category]
          )
        }
      }
      res.status(201).json({ success: true, data: { ...event, totalSeats: gridRows * gridCols } } satisfies ApiResponse<any>)
    } else {
      res.status(201).json({ success: true, data: event } satisfies ApiResponse<typeof event>)
    }
  } catch (err) {
    next(err)
  }
}

export async function editEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUser = requireUser(req)
    const { name, date, priceNormal, pricePremium } = editEventSchema.parse(req.body)
    const eventId = getParamAsString(req, 'id')

    const event = await eventRepo.getEventById(eventId)
    if (!event) throw new ApiError(404, 'Event not found')

    const isOwner = event.created_by === String(currentUser.id)
    if (!isOwner && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to edit this event')
    }

    if (event.status === 'cancelled') {
      throw new ApiError(400, 'Cannot edit a cancelled event')
    }

    const updated = await eventRepo.updateEvent(eventId, {
      name: name || event.name,
      date: date || event.date,
      priceNormal: priceNormal || event.price_normal,
      pricePremium: pricePremium || event.price_premium
    })

    res.json({ success: true, data: updated } satisfies ApiResponse<typeof updated>)
  } catch (err) {
    next(err)
  }
}

export async function cancelEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = getParamAsString(req, 'id')
    const event = await eventRepo.getEventById(eventId)
    if (!event) throw new ApiError(404, 'Event not found')

    const currentUser = requireUser(req)
    const isOwner = event.created_by === String(currentUser.id)
    if (!isOwner && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to cancel this event')
    }

    const updated = await eventRepo.updateEventStatus(eventId, 'cancelled')
    res.json({ success: true, data: updated } satisfies ApiResponse<typeof updated>)
  } catch (err) {
    next(err)
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = getParamAsString(req, 'id')
    const event = await eventRepo.getEventById(eventId)
    if (!event) throw new ApiError(404, 'Event not found')

    const currentUser = requireUser(req)
    const isOwner = event.created_by === String(currentUser.id)
    if (!isOwner && currentUser.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to delete this event')
    }

    if (event.status !== 'cancelled' && currentUser.role !== 'admin') {
      throw new ApiError(400, 'Event must be cancelled before it can be deleted')
    }

    await eventRepo.deleteEvent(eventId)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function effectivePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getEffectivePrice(getParamAsString(req, 'id'))
    if (!result) throw new ApiError(404, 'Event not found')
    res.json({ success: true, data: result } satisfies ApiResponse<typeof result>)
  } catch (err) {
    next(err)
  }
}

