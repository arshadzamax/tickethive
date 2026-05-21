import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as eventController from '../controllers/event.controller.js'

const router = Router()

router.get('/events', eventController.getEvents)
router.get('/events/:id', eventController.getEvent)
router.get('/events/:id/effective-price', eventController.effectivePrice)
router.post('/events', auth, eventController.createEvent)
router.put('/events/:id', auth, eventController.editEvent)
router.patch('/events/:id/status', auth, eventController.cancelEvent)
router.delete('/events/:id', auth, eventController.deleteEvent)

export default router
