import * as eventRepo from '../repositories/event.repo.js'
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
    const { name, date, organiser, rows, cols } = req.body

    if (!name || !name.trim()) throw new ApiError(400, 'Event name is required')
    if (!date) throw new ApiError(400, 'Event date is required')
    if (new Date(date) <= new Date()) throw new ApiError(400, 'Event date must be in the future')

    const gridRows = Math.max(1, Math.min(20, parseInt(rows) || 5))
    const gridCols = Math.max(1, Math.min(30, parseInt(cols) || 10))

    const event = await eventRepo.createEvent({
      name: name.trim(),
      date,
      venueLayout: JSON.stringify({ type: 'grid' }),
      organiser: organiser?.trim() || 'Organiser'
    })

    // Auto-seed seats for the new event
    for (let r = 1; r <= gridRows; r++) {
      for (let n = 1; n <= gridCols; n++) {
        await query(
          'INSERT INTO seats (event_id, row, number) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [event.id, r, n]
        )
      }
    }

    res.status(201).json({ ...event, seats: gridRows * gridCols })
  } catch (err) {
    next(err)
  }
}
