import { SEAT_STATUS } from './constants.js'

export function seatKey(seat) {
  return `${seat.row}-${seat.number}`
}

export function rowIndex(row) {
  if (typeof row === 'number') {
    return row - 1
  }
  if (typeof row === 'string') {
    const code = row.toUpperCase().charCodeAt(0)
    return code - 65
  }
  return 0
}

export function seatPosition(seat, opts = {}) {
  const { cell = 28, gap = 8, rowsTop = 20, colsLeft = 20 } = opts
  const r = rowIndex(seat.row)
  const c = Number(seat.number) - 1
  const x = colsLeft + c * (cell + gap)
  const y = rowsTop + r * (cell + gap)
  return { x, y }
}

export function seatFill(seat, clientId) {
  if (seat.adminLocked) return '#a855f7' // purple for admin-locked
  if (seat.status === SEAT_STATUS.sold) return '#ef4444'
  if (seat.status === SEAT_STATUS.locked) return seat.lockedBy === clientId ? '#fde047' : '#f59e0b'
  return '#22c55e'
}

export function isLockedByOther(seat, clientId) {
  return seat.status === SEAT_STATUS.locked && seat.lockedBy && seat.lockedBy !== clientId
}

export function isAdminLocked(seat) {
  return seat.adminLocked === true || seat.admin_locked === true
}

// convert server payloads (snake_case, timestamp string) to frontend shape
export function normalizeSeat(raw) {
  if (!raw) return raw
  const seat = {
    ...raw,
    lockedBy: raw.locked_by != null ? String(raw.locked_by) : (raw.lockedBy != null ? String(raw.lockedBy) : null),
    lockExpiresAt: raw.lock_expires_at
      ? new Date(raw.lock_expires_at).getTime()
      : raw.lockExpiresAt || null,
    adminLocked: raw.admin_locked ?? raw.adminLocked ?? false
  }
  // remove snake_* keys to avoid confusion
  delete seat.locked_by
  delete seat.lock_expires_at
  delete seat.admin_locked
  return seat
}

export function normalizeSeats(arr) {
  if (!Array.isArray(arr)) return arr
  return arr.map(normalizeSeat)
}
