import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as seatController from '../controllers/seat.controller.js'

const router = Router()

router.get('/seats', seatController.getSeats)
router.post('/seats/:id/hold', auth, seatController.holdSeat)
router.post('/seats/:id/confirm', auth, seatController.confirmSeat)
router.post('/seats/:id/release', auth, seatController.releaseSeat)

export default router

