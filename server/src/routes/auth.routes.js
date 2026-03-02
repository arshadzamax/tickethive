import { Router } from 'express'
import auth from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

const router = Router()

router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', auth, authController.me)

export default router
