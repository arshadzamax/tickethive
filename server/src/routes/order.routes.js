import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as orderController from '../controllers/order.controller.js'

const router = Router()

router.get('/orders', auth, orderController.listOrders)

export default router

