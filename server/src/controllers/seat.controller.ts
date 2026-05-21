import * as seatService from '../services/seat.service.js'
import * as bookingService from '../services/booking.service.js'

export async function getSeats(req, res, next) {
  try {
    const eventId = req.params.eventId
    const seats = await seatService.listSeats(eventId)
    res.json(seats)
  } catch (err) {
    next(err)
  }
}

export async function holdSeat(req, res, next) {
  try {
    const eventId = req.params.eventId
    const seatId = Number(req.params.id)
    const userId = req.user.id
    const seat = await seatService.holdSeat({ seatId, eventId, userId })
    res.json(seat)
  } catch (err) {
    next(err)
  }
}

export async function confirmSeat(req, res, next) {
  try {
    const eventId = req.params.eventId
    const seatId = Number(req.params.id)
    const userId = req.user.id
    const seat = await bookingService.confirmSeat({ seatId, eventId, userId })
    res.json(seat)
  } catch (err) {
    next(err)
  }
}

export async function releaseSeat(req, res, next) {
  try {
    const eventId = req.params.eventId
    const seatId = Number(req.params.id)
    const userId = req.user.id
    const seat = await seatService.releaseSeat({ seatId, eventId, userId })
    res.json(seat)
  } catch (err) {
    next(err)
  }
}
