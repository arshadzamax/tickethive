import * as eventRepo from '../repositories/event.repo.js'
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
