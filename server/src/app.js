import express from 'express'
import http from 'http'
import helmet from 'helmet'
import cors from 'cors'

import env from './config/env.js'
import rateLimiter from './middleware/rateLimit.js'
import errorHandler from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import seatRoutes from './routes/seat.routes.js'
import orderRoutes from './routes/order.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { initSocket } from './websocket/socket.js'
import redis from './config/redis.js'
import logger from './utils/logger.js'

const app = express()

/* =============================
   Security & Core Middlewares
============================= */

app.disable('x-powered-by')

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
)

app.use(express.json())
app.use(rateLimiter)

/* =============================
   Routes
============================= */

app.use('/api', authRoutes)
app.use('/api', seatRoutes)
app.use('/api', orderRoutes)
app.use('/api', adminRoutes)

/* =============================
   Health Check (Production Ready)
============================= */

app.get('/health', async (req, res) => {
  try {
    await redis.ping()

    res.status(200).json({
      status: 'ok',
      redis: 'connected'
    })
  } catch (err) {
    logger.error('Health check failed', { error: err.message })

    res.status(500).json({
      status: 'error',
      redis: 'down'
    })
  }
})

/* =============================
   Global Error Handler
============================= */

app.use(errorHandler)

/* =============================
   Server + Socket Setup
============================= */

const server = http.createServer(app)

server.listen(env.port, () => {
  logger.info('API server listening', { port: env.port })
})

/* =============================
   Initialize WebSocket (Non-blocking)
============================= */

initSocket(server)
  .then(() => {
    logger.info('WebSocket initialized')
  })
  .catch((err) => {
    logger.error('Failed to init socket', { error: err.message })
  })

/* =============================
   Graceful Shutdown
============================= */

const shutdown = async () => {
  logger.info('Shutting down server...')

  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })

  // Force shutdown if hanging
  setTimeout(() => {
    logger.error('Forcing shutdown')
    process.exit(1)
  }, 10000)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

export default app
