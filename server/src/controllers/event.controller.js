import * as eventRepo from '../repositories/event.repo.js'
import * as venueRepo from '../repositories/venue.repo.js'
import { query } from '../config/db.js'
import ApiError from '../utils/ApiError.js'

export async function getEvents(req, res, next) {
  try {
    const events = await eventRepo.getAllEvents()
    res.json(events)
  } catch (err) {
    next(err)
  }
}

export async function getEvent(req, res, next) {
  try {
    const event = await eventRepo.getEventById(req.params.id)
    if (!event) {
      throw new ApiError(404, 'Event not found')
    }
    res.json(event)
  } catch (err) {
    next(err)
  }
}

export async function createEvent(req, res, next) {
  try {
    const { name, date, organiser, priceNormal, pricePremium, venueId } = req.body

    if (!name || !name.trim()) throw new ApiError(400, 'Event name is required')
    if (!date) throw new ApiError(400, 'Event date is required')
    if (new Date(date) <= new Date()) throw new ApiError(400, 'Event date must be in the future')
    if (!venueId) throw new ApiError(400, 'Venue is required')

    const normalPrice = Math.max(10, parseFloat(priceNormal) || 100)
    const premiumPrice = Math.max(normalPrice, parseFloat(pricePremium) || normalPrice * 1.5)

    const venue = await venueRepo.getVenueById(venueId)
    if (!venue) throw new ApiError(404, 'Venue not found')

    const event = await eventRepo.createEvent({
      venueId,
      name: name.trim(),
      date,
      organiser: organiser?.trim() || 'Organiser',
      priceNormal: normalPrice,
      pricePremium: premiumPrice,
      createdBy: req.user.id
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
      res.status(201).json({ ...event, totalSeats: gridRows * gridCols })
    } else {
      res.status(201).json(event)
    }
  } catch (err) {
    next(err)
  }
}

export async function editEvent(req, res, next) {
  try {
    const { name, date, priceNormal, pricePremium } = req.body
    const eventId = req.params.id

    const event = await eventRepo.getEventById(eventId)
    if (!event) throw new ApiError(404, 'Event not found')

    const isOwner = event.created_by === req.user.id
    if (!isOwner && req.user.role !== 'admin') {
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

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function cancelEvent(req, res, next) {
  try {
    const eventId = req.params.id
    const event = await eventRepo.getEventById(eventId)
    if (!event) throw new ApiError(404, 'Event not found')

    const isOwner = event.created_by === req.user.id
    if (!isOwner && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to cancel this event')
    }

    const updated = await eventRepo.updateEventStatus(eventId, 'cancelled')
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const eventId = req.params.id
    const event = await eventRepo.getEventById(eventId)
    if (!event) throw new ApiError(404, 'Event not found')

    const isOwner = event.created_by === req.user.id
    if (!isOwner && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to delete this event')
    }

    if (event.status !== 'cancelled' && req.user.role !== 'admin') {
      throw new ApiError(400, 'Event must be cancelled before it can be deleted')
    }

    await eventRepo.deleteEvent(eventId)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
