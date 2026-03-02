import rateLimit from 'express-rate-limit'
import env from '../config/env.js'

const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false
})

export default limiter

