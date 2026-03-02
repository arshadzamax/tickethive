import * as seatService from '../services/seat.service.js'
import * as bookingService from '../services/booking.service.js'

export async function getSeats(req, res, next) {
  try {
    const seats = await seatService.listSeats()
    res.json(seats)
  } catch (err) {
    next(err)
  }
}

export async function holdSeat(req, res, next) {
  try {
    const seatId = Number(req.params.id)
    const userId = req.user.id
    const seat = await seatService.holdSeat({ seatId, userId })
    res.json(seat)
  } catch (err) {
    next(err)
  }
}

export async function confirmSeat(req, res, next) {
  try {
    const seatId = Number(req.params.id)
    const userId = req.user.id
    const seat = await bookingService.confirmSeat({ seatId, userId })
    res.json(seat)
  } catch (err) {
    next(err)
  }
}

export async function releaseSeat(req, res, next) {
  try {
    const seatId = Number(req.params.id)
    const userId = req.user.id
    const seat = await seatService.releaseSeat({ seatId, userId })
    res.json(seat)
  } catch (err) {
    next(err)
  }
}

