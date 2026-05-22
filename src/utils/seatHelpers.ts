import { SEAT_STATUS } from './constants'

interface Seat {
  row: string | number
  number: string | number
  status?: string
  lockedBy?: string | null
  adminLocked?: boolean
  admin_locked?: boolean
  lock_expires_at?: string
  lockExpiresAt?: number | null
  [key: string]: unknown
}

interface SeatPositionOpts {
  cell?: number
  gap?: number
  rowsTop?: number
  colsLeft?: number
}

export function seatKey(seat: Seat) {
  return `${seat.row}-${seat.number}`
}

export function rowIndex(row: string | number) {
  if (typeof row === 'number') {
    return row - 1
  }
  if (typeof row === 'string') {
    const code = row.toUpperCase().charCodeAt(0)
    return code - 65
  }
  return 0
}

export function seatPosition(seat: Seat, opts: SeatPositionOpts = {}) {
  const { cell = 28, gap = 8, rowsTop = 20, colsLeft = 20 } = opts
  const r = rowIndex(seat.row)
  const c = Number(seat.number) - 1
  const x = colsLeft + c * (cell + gap)
  const y = rowsTop + r * (cell + gap)
  return { x, y }
}

export function seatFill(seat: Seat, clientId: string) {
  if (seat.adminLocked) return '#a855f7' // purple for admin-locked
  if (seat.status === SEAT_STATUS.sold) return '#ef4444'
  if (seat.status === SEAT_STATUS.locked) return seat.lockedBy === clientId ? '#fde047' : '#f59e0b'
  return '#22c55e'
}

export function isLockedByOther(seat: Seat, clientId: string) {
  return seat.status === SEAT_STATUS.locked && seat.lockedBy && seat.lockedBy !== clientId
}

export function isAdminLocked(seat: Seat) {
  return seat.adminLocked === true || seat.admin_locked === true
}

// convert server payloads (snake_case, timestamp string) to frontend shape
export function normalizeSeat(raw: unknown) {
  if (!raw || typeof raw !== 'object') return raw
  const rawSeat = raw as Record<string, unknown>
  const lockedByValue = rawSeat['locked_by'] ?? rawSeat['lockedBy']
  const lockExpiresValue = rawSeat['lock_expires_at'] ?? rawSeat['lockExpiresAt']

  const seat = {
    ...rawSeat,
    lockedBy: lockedByValue != null ? String(lockedByValue) : null,
    lockExpiresAt: typeof lockExpiresValue === 'string' ? new Date(lockExpiresValue).getTime() : lockExpiresValue ?? null,
    adminLocked: rawSeat['admin_locked'] ?? rawSeat['adminLocked'] ?? false
  }

  delete (seat as Record<string, unknown>)['locked_by']
  delete (seat as Record<string, unknown>)['lock_expires_at']
  delete (seat as Record<string, unknown>)['admin_locked']
  return seat
}

export function normalizeSeats(arr: unknown[]) {
  if (!Array.isArray(arr)) return arr
  return arr.map(normalizeSeat)
}
