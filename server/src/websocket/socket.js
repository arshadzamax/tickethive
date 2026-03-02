import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import env from '../config/env.js'
import logger from '../utils/logger.js'

let io

export async function initSocket(httpServer) {
  const pubClient = new Redis(env.redisUrl)
  const subClient = pubClient.duplicate()

  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST']
    }
  })

  io.adapter(createAdapter(pubClient, subClient))

  io.on('connection', socket => {
    logger.info('Socket connected', { id: socket.id })
    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { id: socket.id })
    })
  })

  const subscriber = new Redis(env.redisUrl)
  await subscriber.subscribe('seat_events')
  subscriber.on('message', (channel, message) => {
    if (channel !== 'seat_events') return
    try {
      const payload = JSON.parse(message)
      const { event, seat } = payload
      if (io && event && seat) {
        io.emit(event, seat)
      }
    } catch (e) {
      logger.error('Failed to process seat_events message', { error: e.message })
    }
  })

  return io
}

function emit(event, data) {
  if (io) {
    io.emit(event, data)
  }
}

export function emitSeatLocked(seat) {
  emit('seat_locked', seat)
}

export function emitSeatSold(seat) {
  emit('seat_sold', seat)
}

export function emitSeatReleased(seat) {
  emit('seat_released', seat)
}

export function emitSeatsReset() {
  emit('seats_reset', {})
}

export function emitSeatAdminLocked(seat) {
  emit('seat_admin_locked', seat)
}

export function emitGridResized() {
  emit('grid_resized', {})
}
