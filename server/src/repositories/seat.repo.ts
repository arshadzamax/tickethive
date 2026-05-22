import type { PoolClient } from 'pg'
import { query, getClient } from '../config/db.js'
import type { Seat } from '../types/db.js'

export async function getAllSeats(eventId: string | number): Promise<Seat[]> {
  const res = await query(
    'SELECT id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked FROM seats WHERE event_id = $1 ORDER BY row, number',
    [eventId]
  )
  return res.rows
}

export async function getSeatByIdForUpdate(client: PoolClient, seatId: string | number, eventId: string | number): Promise<Seat | null> {
  const res = await client.query(
    'SELECT id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked FROM seats WHERE id = $1 AND event_id = $2 FOR UPDATE',
    [seatId, eventId]
  )
  return res.rows[0] || null
}

export async function lockSeat(client: PoolClient, seatId: string | number, eventId: string | number, userId: string | number, lockMs: number): Promise<Seat | null> {
  const res = await client.query(
    `UPDATE seats
     SET status = 'locked',
         locked_by = $3,
         lock_expires_at = NOW() + ($4::int || ' milliseconds')::interval,
         updated_at = NOW()
     WHERE id = $1 AND event_id = $2
     RETURNING id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId, eventId, userId, lockMs]
  )
  return res.rows[0] || null
}

export async function markSeatSold(client: PoolClient, seatId: string | number, eventId: string | number): Promise<Seat | null> {
  const res = await client.query(
    `UPDATE seats
     SET status = 'sold',
         locked_by = NULL,
         lock_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $1 AND event_id = $2
     RETURNING id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId, eventId]
  )
  return res.rows[0] || null
}

export async function releaseSeat(client: PoolClient, seatId: string | number, eventId: string | number): Promise<Seat | null> {
  const res = await client.query(
    `UPDATE seats
     SET status = 'available',
         locked_by = NULL,
         lock_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $1 AND event_id = $2
     RETURNING id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId, eventId]
  )
  return res.rows[0] || null
}

export async function expireLockedSeats() {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const res = await client.query(
      `UPDATE seats
       SET status = 'available',
           locked_by = NULL,
           lock_expires_at = NULL,
           updated_at = NOW()
       WHERE status = 'locked'
         AND lock_expires_at IS NOT NULL
         AND lock_expires_at < NOW()
       RETURNING id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked`
    )
    await client.query('COMMIT')
    return res.rows
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/* =============================
   Admin Operations
============================= */

export async function resetAllSeats(eventId: string | number) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM orders WHERE event_id = $1', [eventId])
    await client.query(
      `UPDATE seats
       SET status = 'available',
           locked_by = NULL,
           lock_expires_at = NULL,
           admin_locked = FALSE,
           updated_at = NOW()
       WHERE event_id = $1`,
      [eventId]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function adminLockSeat(seatId: string | number, eventId: string | number) {
  const res = await query(
    `UPDATE seats
     SET admin_locked = TRUE,
         status = 'available',
         locked_by = NULL,
         lock_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $1 AND event_id = $2
     RETURNING id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId, eventId]
  )
  return res.rows[0] || null
}

export async function adminUnlockSeat(seatId: string | number, eventId: string | number) {
  const res = await query(
    `UPDATE seats
     SET admin_locked = FALSE,
         updated_at = NOW()
     WHERE id = $1 AND event_id = $2
     RETURNING id, event_id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId, eventId]
  )
  return res.rows[0] || null
}

export async function getSeatStats(eventId: string | number) {
  const res = await query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'available' AND admin_locked = FALSE) AS available,
      COUNT(*) FILTER (WHERE status = 'locked') AS locked,
      COUNT(*) FILTER (WHERE status = 'sold') AS sold,
      COUNT(*) FILTER (WHERE admin_locked = TRUE) AS admin_locked,
      MAX(row) AS max_row,
      MAX(number) AS max_col
    FROM seats
    WHERE event_id = $1
  `, [eventId])
  const row = res.rows[0]
  return {
    total: Number(row.total),
    available: Number(row.available),
    locked: Number(row.locked),
    sold: Number(row.sold),
    adminLocked: Number(row.admin_locked),
    rows: Number(row.max_row) || 0,
    cols: Number(row.max_col) || 0
  }
}

export async function getGridDimensions(eventId: string | number) {
  const res = await query(
    'SELECT MAX(row) AS max_row, MAX(number) AS max_col FROM seats WHERE event_id = $1',
    [eventId]
  )
  const row = res.rows[0]
  return {
    rows: Number(row.max_row) || 0,
    cols: Number(row.max_col) || 0
  }
}

export async function resizeGrid(eventId: string | number, newRows: number, newCols: number) {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const dims = await client.query(
      'SELECT MAX(row) AS max_row, MAX(number) AS max_col FROM seats WHERE event_id = $1',
      [eventId]
    )
    const currentRows = Number(dims.rows[0].max_row) || 0
    const currentCols = Number(dims.rows[0].max_col) || 0

    // Remove seats beyond new dimensions
    if (newRows < currentRows || newCols < currentCols) {
      await client.query(
        `DELETE FROM orders WHERE seat_id IN (
          SELECT id FROM seats WHERE event_id = $1 AND (row > $2 OR number > $3)
        )`,
        [eventId, newRows, newCols]
      )
      await client.query(
        'DELETE FROM seats WHERE event_id = $1 AND (row > $2 OR number > $3)',
        [eventId, newRows, newCols]
      )
    }

    // Add new seats
    for (let r = 1; r <= newRows; r++) {
      for (let n = 1; n <= newCols; n++) {
        await client.query(
          'INSERT INTO seats (event_id, row, number) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [eventId, r, n]
        )
      }
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
