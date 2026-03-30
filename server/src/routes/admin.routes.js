import { Router } from 'express'
import auth from '../middleware/auth.js'
import requireAdmin from '../middleware/requireAdmin.js'
import * as adminController from '../controllers/admin.controller.js'

const router = Router()

router.use(auth, requireAdmin)

router.post('/admin/events/:eventId/seats/reset', adminController.resetAllSeats)
router.post('/admin/events/:eventId/seats/:id/lock', adminController.adminLockSeat)
router.post('/admin/events/:eventId/seats/:id/unlock', adminController.adminUnlockSeat)
router.put('/admin/events/:eventId/seats/resize', adminController.resizeGrid)
router.get('/admin/events/:eventId/stats', adminController.getStats)

export default router
