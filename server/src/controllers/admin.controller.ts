import type { Request, Response, NextFunction } from 'express'
import * as seatRepo from '../repositories/seat.repo.js'
import ApiError from '../utils/ApiError.js'
import { getParamAsNumber, getParamAsString } from '../utils/params.js'
import { emitSeatsReset, emitSeatAdminLocked, emitGridResized } from '../websocket/socket.js'
import { resizeGridSchema } from '../utils/schemas.js'
import type { ApiResponse } from '../types/response.js'

export async function resetAllSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = getParamAsString(req, 'eventId')
        await seatRepo.resetAllSeats(eventId)
        emitSeatsReset(eventId)
        res.json({ success: true, data: { message: 'All seats reset to available' } } satisfies ApiResponse<any>)
    } catch (err) {
        next(err)
    }
}

export async function adminLockSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = getParamAsString(req, 'eventId')
        const seatId = getParamAsNumber(req, 'id')
        const seat = await seatRepo.adminLockSeat(seatId, eventId)
        if (!seat) {
            throw new ApiError(404, 'Seat not found')
        }
        emitSeatAdminLocked(seat, eventId)
        res.json({ success: true, data: seat } satisfies ApiResponse<typeof seat>)
    } catch (err) {
        next(err)
    }
}

export async function adminUnlockSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = getParamAsString(req, 'eventId')
        const seatId = getParamAsNumber(req, 'id')
        const seat = await seatRepo.adminUnlockSeat(seatId, eventId)
        if (!seat) {
            throw new ApiError(404, 'Seat not found')
        }
        emitSeatAdminLocked(seat, eventId)
        res.json({ success: true, data: seat } satisfies ApiResponse<typeof seat>)
    } catch (err) {
        next(err)
    }
}

export async function resizeGrid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = getParamAsString(req, 'eventId')
        const { rows, cols } = resizeGridSchema.parse(req.body)
        await seatRepo.resizeGrid(eventId, rows, cols)
        emitGridResized(eventId)
        const stats = await seatRepo.getSeatStats(eventId)
        res.json({ success: true, data: { message: `Grid resized to ${rows}x${cols}`, stats } } satisfies ApiResponse<any>)
    } catch (err) {
        next(err)
    }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const eventId = getParamAsString(req, 'eventId')
        const stats = await seatRepo.getSeatStats(eventId)
        res.json({ success: true, data: stats } satisfies ApiResponse<typeof stats>)
    } catch (err) {
        next(err)
    }
}
