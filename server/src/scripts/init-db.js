import pool from '../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'


function getArg(name, defaultValue) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return defaultValue
  return process.argv[idx + 1]
}

async function dropSchema() {
  await pool.query(`
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS seats;
    DROP TABLE IF EXISTS users;
  `)
}

async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS seats (
      id SERIAL PRIMARY KEY,
      row INTEGER NOT NULL,
      number INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'available',
      locked_by TEXT,
      lock_expires_at TIMESTAMPTZ,
      admin_locked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (row, number)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      user_id TEXT NOT NULL,
      seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
      payment_status VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (seat_id)
    );
  `)
}

async function seedAdmin() {
  const email = 'admin@tickethive.com'
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    console.log('admin user already exists')
    return
  }
  const hash = await bcrypt.hash('admin123', 10)
  await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
    [email, hash, 'admin']
  )
  console.log('created admin user (admin@tickethive.com / admin123)')
}

async function seedSeats(rows = 5, cols = 10) {
  for (let r = 1; r <= rows; r++) {
    for (let n = 1; n <= cols; n++) {
      await pool.query(
        'INSERT INTO seats (row, number) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [r, n]
      )
    }
  }
  console.log(`inserted ${rows * cols} seats`)
}

async function seedOrders(count = 0, userIds = ['user1', 'user2']) {
  if (count <= 0) return
  const res = await pool.query(
    'SELECT id FROM seats WHERE status = $1 ORDER BY id LIMIT $2',
    ['available', count]
  )
  const seats = res.rows.map(r => r.id)
  if (seats.length === 0) {
    console.log('no available seats to mark as sold')
    return
  }

  for (let i = 0; i < seats.length; i++) {
    const seatId = seats[i]
    const userId = userIds[i % userIds.length]
    const orderId = uuidv4()
    await pool.query(
      'UPDATE seats SET status = $1, updated_at = NOW() WHERE id = $2',
      ['sold', seatId]
    )
    await pool.query(
      `INSERT INTO orders (id, user_id, seat_id, payment_status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [orderId, userId, seatId, 'paid']
    )
  }
  console.log(`created ${seats.length} orders and marked seats sold`)
}

async function main() {
  try {
    const rows = parseInt(getArg('--rows', '5'), 10)
    const cols = parseInt(getArg('--cols', '10'), 10)
    const orders = parseInt(getArg('--orders', '0'), 10)
    const users = getArg('--users', 'user1,user2').split(',')
    const reset = process.argv.includes('--reset')

    if (reset) {
      console.log('dropping existing schema')
      await dropSchema()
    }

    console.log('creating schema')
    await createSchema()

    console.log('seeding admin user')
    await seedAdmin()

    console.log(`seeding ${rows}x${cols} seats`)
    await seedSeats(rows, cols)

    if (orders > 0) {
      console.log(`seeding ${orders} orders`)
      await seedOrders(orders, users)
    }

    console.log('database initialization complete')
  } catch (err) {
    console.error('failed to initialize database', err)
  } finally {
    pool.end()
  }
}

main()
