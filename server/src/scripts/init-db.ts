import pool from '../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'


function getArg(name: string, defaultValue: string): string {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return defaultValue
  return process.argv[idx + 1] ?? defaultValue
}

async function dropSchema() {
  await pool.query(`
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS group_bookings;
    DROP TABLE IF EXISTS seats;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS venues;
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

    CREATE TABLE IF NOT EXISTS venues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'SEATED',
      rows INTEGER,
      cols INTEGER,
      total_capacity INTEGER,
      default_premium_rows JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL,
      organiser TEXT,
      price_normal DECIMAL(10, 2) DEFAULT 100.00,
      price_premium DECIMAL(10, 2) DEFAULT 150.00,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS seats (
      id SERIAL PRIMARY KEY,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      row INTEGER NOT NULL,
      number INTEGER NOT NULL,
      category VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
      status VARCHAR(20) NOT NULL DEFAULT 'available',
      locked_by TEXT,
      lock_expires_at TIMESTAMPTZ,
      admin_locked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (event_id, row, number)
    );

    CREATE TABLE IF NOT EXISTS group_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      group_booking_id UUID REFERENCES group_bookings(id) ON DELETE SET NULL,
      seat_id INTEGER REFERENCES seats(id) ON DELETE CASCADE,
      ticket_count INTEGER,
      category VARCHAR(20),
      price_per_unit DECIMAL(10, 2),
      total_amount DECIMAL(10, 2),
      payment_status VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
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

async function seedVenue(
  name: string,
  type: string,
  rows: number | null,
  cols: number | null,
  capacity: number,
  premiumRows: number[]
): Promise<string> {
  const res = await pool.query(
    `INSERT INTO venues (name, type, rows, cols, total_capacity, default_premium_rows)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name`,
    [name, type, rows, cols, capacity, JSON.stringify(premiumRows || [])]
  )
  const venue = res.rows[0]
  console.log(`created venue "${venue.name}" (${venue.id})`)
  return venue.id
}

async function seedEvent(venueId: string, name: string, priceNormal = 100, pricePremium = 150): Promise<string> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(19, 0, 0, 0)

  const res = await pool.query(
    `INSERT INTO events (venue_id, name, date, organiser, price_normal, price_premium)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name`,
    [venueId, name, tomorrow.toISOString(), 'TicketHive Admin', priceNormal, pricePremium]
  )
  const event = res.rows[0]
  console.log(`created event "${event.name}" (${event.id}) at venue ${venueId}`)
  return event.id
}

async function seedSeats(eventId: string, rows = 5, cols = 10, premiumRows: number[] = [1, 2]): Promise<void> {
  for (let r = 1; r <= rows; r++) {
    for (let n = 1; n <= cols; n++) {
      const category = premiumRows.includes(r) ? 'PREMIUM' : 'NORMAL'
      await pool.query(
        'INSERT INTO seats (event_id, row, number, category) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [eventId, r, n, category]
      )
    }
  }
  console.log(`inserted ${rows * cols} seats for event ${eventId}`)
}

async function seedOrders(eventId: string, count = 0, userIds: string[] = ['user1', 'user2']): Promise<void> {
  if (count <= 0) return
  const res = await pool.query(
    'SELECT id FROM seats WHERE event_id = $1 AND status = $2 ORDER BY id LIMIT $3',
    [eventId, 'available', count]
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
    
    // Determine price based on seat category
    const seatRes = await pool.query('SELECT category FROM seats WHERE id = $1', [seatId])
    const category = seatRes.rows[0].category
    
    const eventRes = await pool.query('SELECT price_normal, price_premium FROM events WHERE id = $1', [eventId])
    const { price_normal, price_premium } = eventRes.rows[0]
    const pricePerUnit = category === 'PREMIUM' ? price_premium : price_normal
    
    await pool.query(
      'UPDATE seats SET status = $1, updated_at = NOW() WHERE id = $2 AND event_id = $3',
      ['sold', seatId, eventId]
    )
    await pool.query(
      `INSERT INTO orders (id, event_id, user_id, seat_id, category, price_per_unit, total_amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [orderId, eventId, userId, seatId, category, pricePerUnit, pricePerUnit, 'paid']
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

    console.log('seeding venue')
    const venueId = await seedVenue('Main Arena', 'SEATED', rows, cols, rows * cols, [1, 2])

    console.log('seeding event')
    const eventId = await seedEvent(venueId, 'Demo Concert', 100, 150)

    console.log(`seeding ${rows}x${cols} seats`)
    await seedSeats(eventId, rows, cols, [1, 2])

    if (orders > 0) {
      console.log(`seeding ${orders} orders`)
      await seedOrders(eventId, orders, users)
    }

    // Quick sample events for testing
    console.log('creating sample events and venues for testing...')
    const seatedEvents = ['Rock Festival', 'Jazz Concert', 'Comedy Show'];
    const generalEvents = ['Festival Tickets', 'Theater Pass', 'Sports Event'];
    
    // Create an extra Seated Venue
    const seatedVenueId = await seedVenue('Grand Theater', 'SEATED', 8, 12, 96, [1, 2, 3])

    // Create 3 SEATED events
    for (let i = 0; i < seatedEvents.length; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (i + 1) * 5);
      futureDate.setHours(18, 0, 0, 0);
      
      const priceNormal = 100 + (i * 20);
      const res = await pool.query(
        `INSERT INTO events (venue_id, name, date, organiser, price_normal, price_premium)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [seatedVenueId, seatedEvents[i], futureDate.toISOString(), 'TicketHive', priceNormal, priceNormal * 1.5]
      );
      await seedSeats(res.rows[0].id, 8, 12, [1, 2, 3]);
    }

    // Create a General Venue
    const generalVenueId = await seedVenue('Open Fields', 'GENERAL', null, null, 500, [])

    // Create 3 GENERAL events
    for (let i = 0; i < generalEvents.length; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (i + 4) * 5);
      futureDate.setHours(18, 0, 0, 0);
      
      const priceNormal = 150 + (i * 20);
      await pool.query(
        `INSERT INTO events (venue_id, name, date, organiser, price_normal, price_premium)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [generalVenueId, generalEvents[i], futureDate.toISOString(), 'TicketHive', priceNormal, priceNormal * 1.5]
      );
    }

    console.log('database initialization complete')
  } catch (err) {
    console.error('failed to initialize database', err)
  } finally {
    pool.end()
  }
}

main()
