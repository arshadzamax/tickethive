import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as eventController from '../controllers/event.controller.js'

const router = Router()

router.get('/events', eventController.getEvents)
router.get('/events/:id', eventController.getEvent)
router.post('/events', auth, eventController.createEvent)

export default router
