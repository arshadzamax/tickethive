import { io, type Socket } from 'socket.io-client'
import { WS_URL } from '../utils/constants'

let socket: Socket | null = null

export function connectSocket() {
  if (!socket) {
    socket = io(WS_URL, { transports: ['websocket'], autoConnect: true })
  }
  return socket
}

export function getSocket() {
  if (!socket) return connectSocket()
  return socket
}

/** Tell the server to add this socket to the event_${eventId} room */
export function joinEvent(eventId: string | number) {
  if (eventId) getSocket().emit('join_event', eventId)
}

/** Tell the server to remove this socket from the event_${eventId} room */
export function leaveEvent(eventId: string | number) {
  if (eventId) getSocket().emit('leave_event', eventId)
}

export function onSeatLocked(cb: (...args: any[]) => void) {
  getSocket().on('seat_locked', cb)
}

export function onSeatSold(cb: (...args: any[]) => void) {
  getSocket().on('seat_sold', cb)
}

export function onSeatReleased(cb: (...args: any[]) => void) {
  getSocket().on('seat_released', cb)
}

export function onSeatsReset(cb: (...args: any[]) => void) {
  getSocket().on('seats_reset', cb)
}

export function onSeatAdminLocked(cb: (...args: any[]) => void) {
  getSocket().on('seat_admin_locked', cb)
}

export function onGridResized(cb: (...args: any[]) => void) {
  getSocket().on('grid_resized', cb)
}

export function onConnection(cb: (status: 'connected' | 'disconnected') => void) {
  const s = getSocket()
  s.on('connect', () => cb('connected'))
  s.on('disconnect', () => cb('disconnected'))
  s.on('connect_error', () => cb('disconnected'))
}

export function disconnectSocket() {
  if (socket) socket.disconnect()
}
