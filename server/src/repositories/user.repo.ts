import { query } from '../config/db.js'

export async function findByEmail(email: string) {
  const res = await query('SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1', [email])
  return res.rows[0] || null
}

export async function findById(id: string) {
  const res = await query('SELECT id, email, role, created_at FROM users WHERE id = $1', [id])
  return res.rows[0] || null
}

interface CreateUserInput {
  email: string
  passwordHash: string
  role?: string
}

export async function createUser({ email, passwordHash, role = 'user' }: CreateUserInput) {
  const res = await query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
     RETURNING id, email, role, created_at`,
    [email, passwordHash, role]
  )
  return res.rows[0]
}
