import pg from 'pg'
import env from './env.js'
import logger from '../utils/logger.js'

const { Pool } = pg

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000
})

pool.on('error', err => {
  logger.error('Unexpected PostgreSQL error', { err })
})

export async function getClient() {
  return pool.connect()
}

export async function query(text, params) {
  return pool.query(text, params)
}

export default pool

