import { Router } from 'express'
import auth from '../middleware/auth.js'
import requireAdmin from '../middleware/requireAdmin.js'
import * as adminController from '../controllers/admin.controller.js'

const router = Router()

router.post('/admin/events/:eventId/seats/reset', auth, requireAdmin, adminController.resetAllSeats)
router.post('/admin/events/:eventId/seats/:id/lock', auth, requireAdmin, adminController.adminLockSeat)
router.post('/admin/events/:eventId/seats/:id/unlock', auth, requireAdmin, adminController.adminUnlockSeat)
router.put('/admin/events/:eventId/seats/resize', auth, requireAdmin, adminController.resizeGrid)
router.get('/admin/events/:eventId/stats', auth, requireAdmin, adminController.getStats)

export default router
