import { query, getClient } from '../config/db.js'

export async function getAllSeats() {
  const res = await query('SELECT id, row, number, status, locked_by, lock_expires_at, admin_locked FROM seats ORDER BY row, number', [])
  return res.rows
}

export async function getSeatByIdForUpdate(client, seatId) {
  const res = await client.query(
    'SELECT id, row, number, status, locked_by, lock_expires_at, admin_locked FROM seats WHERE id = $1 FOR UPDATE',
    [seatId]
  )
  return res.rows[0] || null
}

export async function lockSeat(client, seatId, userId, lockMs) {
  const res = await client.query(
    `UPDATE seats
     SET status = 'locked',
         locked_by = $2,
         lock_expires_at = NOW() + ($3::int || ' milliseconds')::interval,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId, userId, lockMs]
  )
  return res.rows[0] || null
}

export async function markSeatSold(client, seatId) {
  const res = await client.query(
    `UPDATE seats
     SET status = 'sold',
         locked_by = NULL,
         lock_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId]
  )
  return res.rows[0] || null
}

export async function releaseSeat(client, seatId) {
  const res = await client.query(
    `UPDATE seats
     SET status = 'available',
         locked_by = NULL,
         lock_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId]
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
       RETURNING id, row, number, status, locked_by, lock_expires_at, admin_locked`
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

export async function resetAllSeats() {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM orders')
    await client.query(
      `UPDATE seats
       SET status = 'available',
           locked_by = NULL,
           lock_expires_at = NULL,
           admin_locked = FALSE,
           updated_at = NOW()`
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function adminLockSeat(seatId) {
  const res = await query(
    `UPDATE seats
     SET admin_locked = TRUE,
         status = 'available',
         locked_by = NULL,
         lock_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId]
  )
  return res.rows[0] || null
}

export async function adminUnlockSeat(seatId) {
  const res = await query(
    `UPDATE seats
     SET admin_locked = FALSE,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, row, number, status, locked_by, lock_expires_at, admin_locked`,
    [seatId]
  )
  return res.rows[0] || null
}

export async function getSeatStats() {
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
  `)
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

export async function getGridDimensions() {
  const res = await query('SELECT MAX(row) AS max_row, MAX(number) AS max_col FROM seats')
  const row = res.rows[0]
  return {
    rows: Number(row.max_row) || 0,
    cols: Number(row.max_col) || 0
  }
}

export async function resizeGrid(newRows, newCols) {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const dims = await client.query('SELECT MAX(row) AS max_row, MAX(number) AS max_col FROM seats')
    const currentRows = Number(dims.rows[0].max_row) || 0
    const currentCols = Number(dims.rows[0].max_col) || 0

    // Remove seats beyond new dimensions (only if available and not sold)
    if (newRows < currentRows || newCols < currentCols) {
      // Delete orders for seats that will be removed
      await client.query(
        `DELETE FROM orders WHERE seat_id IN (
          SELECT id FROM seats WHERE row > $1 OR number > $2
        )`,
        [newRows, newCols]
      )
      await client.query(
        'DELETE FROM seats WHERE row > $1 OR number > $2',
        [newRows, newCols]
      )
    }

    // Add new seats
    for (let r = 1; r <= newRows; r++) {
      for (let n = 1; n <= newCols; n++) {
        await client.query(
          'INSERT INTO seats (row, number) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [r, n]
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
