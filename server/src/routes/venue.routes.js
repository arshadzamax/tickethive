import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as venueController from '../controllers/venue.controller.js'

const router = Router()

router.get('/venues', venueController.getVenues)
router.get('/venues/:id', venueController.getVenue)
router.post('/venues', auth, venueController.createVenue)

export default router
