import { Server, type Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'
import type { Server as HttpServer } from 'http'
import env from '../config/env.js'
import logger from '../utils/logger.js'
import type { Seat } from '../types/db.js'

export interface ServerToClientEvents {
  seat_locked: (seat: Seat) => void
  seat_released: (seat: Seat) => void
  seat_sold: (seat: Seat) => void
  seats_reset: (data: Record<string, never>) => void
  seat_admin_locked: (seat: Seat) => void
  grid_resized: (data: Record<string, never>) => void
}

export interface ClientToServerEvents {
  join_event: (eventId: string | number) => void
  leave_event: (eventId: string | number) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId?: string
}

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null

export async function initSocket(httpServer: HttpServer) {
  const pubClient = env.redisUrl ? new Redis(env.redisUrl) : new Redis()
  const subClient = pubClient.duplicate()

  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST']
    }
  })

  io.adapter(createAdapter(pubClient, subClient))

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    logger.info('Socket connected', { id: socket.id })

    // Client emits this when they open a specific event's booking/admin page
    socket.on('join_event', (eventId: string | number) => {
      if (!eventId) return
      const room = `event_${eventId}`
      socket.join(room)
      logger.info('Socket joined event room', { id: socket.id, room })
    })

    socket.on('leave_event', (eventId: string | number) => {
      if (!eventId) return
      socket.leave(`event_${eventId}`)
    })

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { id: socket.id })
    })
  })

  // Redis pub/sub subscriber — forward seat events to the correct event room
  const subscriber = env.redisUrl ? new Redis(env.redisUrl) : new Redis()
  await subscriber.subscribe('seat_events')
  subscriber.on('message', (channel: string, message: string) => {
    if (channel !== 'seat_events') return
    try {
      const payload = JSON.parse(message)
      const { event, seat, eventId } = payload
      if (!io || !event || !seat) return

      if (eventId) {
        (io.to(`event_${eventId}`).emit as any)(event, seat)
      } else {
        // Fallback: broadcast globally (should not happen in normal operation)
        (io.emit as any)(event, seat)
      }
    } catch (e) {
      const err = e as Error
      logger.error('Failed to process seat_events message', { error: err.message })
    }
  })

  return io
}

function emitToRoom<Ev extends keyof ServerToClientEvents>(
  eventId: string | number | undefined,
  event: Ev,
  data: Parameters<ServerToClientEvents[Ev]>[0]
) {
  if (!io) return
  if (eventId) {
    (io.to(`event_${eventId}`).emit as any)(event, data)
  } else {
    (io.emit as any)(event, data)
  }
}

export function emitSeatLocked(seat: Seat, eventId: string | number) {
  emitToRoom(eventId, 'seat_locked', seat)
}

export function emitSeatSold(seat: Seat, eventId: string | number) {
  emitToRoom(eventId, 'seat_sold', seat)
}

export function emitSeatReleased(seat: Seat, eventId: string | number) {
  emitToRoom(eventId, 'seat_released', seat)
}

export function emitSeatsReset(eventId: string | number) {
  emitToRoom(eventId, 'seats_reset', {})
}

export function emitSeatAdminLocked(seat: Seat, eventId: string | number) {
  emitToRoom(eventId, 'seat_admin_locked', seat)
}

export function emitGridResized(eventId: string | number) {
  emitToRoom(eventId, 'grid_resized', {})
}
