import { io } from 'socket.io-client'
import { WS_URL } from '../utils/constants.js'

let socket

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
export function joinEvent(eventId) {
  if (eventId) getSocket().emit('join_event', eventId)
}

/** Tell the server to remove this socket from the event_${eventId} room */
export function leaveEvent(eventId) {
  if (eventId) getSocket().emit('leave_event', eventId)
}

export function onSeatLocked(cb) {
  getSocket().on('seat_locked', cb)
}

export function onSeatSold(cb) {
  getSocket().on('seat_sold', cb)
}

export function onSeatReleased(cb) {
  getSocket().on('seat_released', cb)
}

export function onSeatsReset(cb) {
  getSocket().on('seats_reset', cb)
}

export function onSeatAdminLocked(cb) {
  getSocket().on('seat_admin_locked', cb)
}

export function onGridResized(cb) {
  getSocket().on('grid_resized', cb)
}

export function onConnection(cb) {
  const s = getSocket()
  s.on('connect', () => cb('connected'))
  s.on('disconnect', () => cb('disconnected'))
  s.on('connect_error', () => cb('disconnected'))
}

export function disconnectSocket() {
  if (socket) socket.disconnect()
}
