export const SEAT_STATUS = {
  available: 'available',
  locked: 'locked',
  sold: 'sold'
}

export const LOCK_DURATION_MS = 5 * 60 * 1000

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000'

export function getClientId() {
  const key = 'th_client_id'
  let v = localStorage.getItem(key)
  if (!v) {
    v = (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(key, v)
  }
  return v
}
