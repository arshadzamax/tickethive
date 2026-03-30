import { Router } from 'express'
import * as eventController from '../controllers/event.controller.js'

const router = Router()

router.get('/events', eventController.getEvents)
router.get('/events/:id', eventController.getEvent)

export default router
