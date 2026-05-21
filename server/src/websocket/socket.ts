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

    // Client emits this when they open a specific event's booking/admin page
    socket.on('join_event', (eventId) => {
      if (!eventId) return
      const room = `event_${eventId}`
      socket.join(room)
      logger.info('Socket joined event room', { id: socket.id, room })
    })

    socket.on('leave_event', (eventId) => {
      if (!eventId) return
      socket.leave(`event_${eventId}`)
    })

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { id: socket.id })
    })
  })

  // Redis pub/sub subscriber — forward seat events to the correct event room
  const subscriber = new Redis(env.redisUrl)
  await subscriber.subscribe('seat_events')
  subscriber.on('message', (channel, message) => {
    if (channel !== 'seat_events') return
    try {
      const payload = JSON.parse(message)
      const { event, seat, eventId } = payload
      if (!io || !event || !seat) return

      if (eventId) {
        io.to(`event_${eventId}`).emit(event, seat)
      } else {
        // Fallback: broadcast globally (should not happen in normal operation)
        io.emit(event, seat)
      }
    } catch (e) {
      logger.error('Failed to process seat_events message', { error: e.message })
    }
  })

  return io
}

function emitToRoom(eventId, event, data) {
  if (!io) return
  if (eventId) {
    io.to(`event_${eventId}`).emit(event, data)
  } else {
    io.emit(event, data)
  }
}

export function emitSeatLocked(seat, eventId) {
  emitToRoom(eventId, 'seat_locked', seat)
}

export function emitSeatSold(seat, eventId) {
  emitToRoom(eventId, 'seat_sold', seat)
}

export function emitSeatReleased(seat, eventId) {
  emitToRoom(eventId, 'seat_released', seat)
}

export function emitSeatsReset(eventId) {
  emitToRoom(eventId, 'seats_reset', {})
}

export function emitSeatAdminLocked(seat, eventId) {
  emitToRoom(eventId, 'seat_admin_locked', seat)
}

export function emitGridResized(eventId) {
  emitToRoom(eventId, 'grid_resized', {})
}
