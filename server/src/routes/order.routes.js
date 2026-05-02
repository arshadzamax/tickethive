import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as orderController from '../controllers/order.controller.js'

const router = Router()

// Regular orders
router.get('/orders', auth, orderController.listOrders)

// Group bookings
router.post('/group-bookings/hold', auth, orderController.holdBooking)
router.post('/group-bookings/release', auth, orderController.releaseBooking)
router.post('/group-bookings', auth, orderController.createGroupBooking)
router.get('/group-bookings', auth, orderController.listGroupBookings)
router.get('/group-bookings/:groupBookingId', auth, orderController.getGroupBooking)

export default router