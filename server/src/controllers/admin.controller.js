import * as seatRepo from '../repositories/seat.repo.js'
import ApiError from '../utils/ApiError.js'
import { emitSeatsReset, emitSeatAdminLocked, emitGridResized } from '../websocket/socket.js'

export async function resetAllSeats(req, res, next) {
    try {
        await seatRepo.resetAllSeats()
        emitSeatsReset()
        res.json({ message: 'All seats reset to available' })
    } catch (err) {
        next(err)
    }
}

export async function adminLockSeat(req, res, next) {
    try {
        const seatId = Number(req.params.id)
        const seat = await seatRepo.adminLockSeat(seatId)
        if (!seat) {
            throw new ApiError(404, 'Seat not found')
        }
        emitSeatAdminLocked(seat)
        res.json(seat)
    } catch (err) {
        next(err)
    }
}

export async function adminUnlockSeat(req, res, next) {
    try {
        const seatId = Number(req.params.id)
        const seat = await seatRepo.adminUnlockSeat(seatId)
        if (!seat) {
            throw new ApiError(404, 'Seat not found')
        }
        emitSeatAdminLocked(seat)
        res.json(seat)
    } catch (err) {
        next(err)
    }
}

export async function resizeGrid(req, res, next) {
    try {
        const { rows, cols } = req.body
        if (!rows || !cols || rows < 1 || cols < 1 || rows > 50 || cols > 50) {
            throw new ApiError(400, 'Rows and cols must be between 1 and 50')
        }
        await seatRepo.resizeGrid(rows, cols)
        emitGridResized()
        const stats = await seatRepo.getSeatStats()
        res.json({ message: `Grid resized to ${rows}x${cols}`, stats })
    } catch (err) {
        next(err)
    }
}

export async function getStats(req, res, next) {
    try {
        const stats = await seatRepo.getSeatStats()
        res.json(stats)
    } catch (err) {
        next(err)
    }
}
