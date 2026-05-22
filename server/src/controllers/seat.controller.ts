import * as seatService from '../services/seat.service.js'
import * as bookingService from '../services/booking.service.js'

import type { Request, Response, NextFunction } from 'express'
import { getParamAsString, getParamAsNumber, requireUser } from '../utils/params.js'
import type { ApiResponse } from '../types/response.js'

export async function getSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = getParamAsString(req, 'eventId')
    const seats = await seatService.listSeats(eventId)
    res.json({ success: true, data: seats } satisfies ApiResponse<typeof seats>)
  } catch (err) {
    next(err)
  }
}

export async function holdSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = getParamAsString(req, 'eventId')
    const seatId = getParamAsNumber(req, 'id')
    const userId = requireUser(req).id
    const seat = await seatService.holdSeat({ seatId, eventId, userId })
    res.json({ success: true, data: seat } satisfies ApiResponse<typeof seat>)
  } catch (err) {
    next(err)
  }
}

export async function confirmSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = getParamAsString(req, 'eventId')
    const seatId = getParamAsNumber(req, 'id')
    const userId = requireUser(req).id
    const seat = await bookingService.confirmSeat({ seatId, eventId, userId })
    res.json({ success: true, data: seat } satisfies ApiResponse<typeof seat>)
  } catch (err) {
    next(err)
  }
}

export async function releaseSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = getParamAsString(req, 'eventId')
    const seatId = getParamAsNumber(req, 'id')
    const userId = requireUser(req).id
    const seat = await seatService.releaseSeat({ seatId, eventId, userId })
    res.json({ success: true, data: seat } satisfies ApiResponse<typeof seat>)
  } catch (err) {
    next(err)
  }
}
