import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as userRepo from '../repositories/user.repo.js'
import ApiError from '../utils/ApiError.js'
import env from '../config/env.js'

function signToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '7d' })
}

export async function register(req, res, next) {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required')
        }
        if (password.length < 6) {
            throw new ApiError(400, 'Password must be at least 6 characters')
        }

        const existing = await userRepo.findByEmail(email)
        if (existing) {
            throw new ApiError(409, 'Email already registered')
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await userRepo.createUser({ email, passwordHash })
        const token = signToken(user)

        res.status(201).json({
            user: { id: user.id, email: user.email, role: user.role },
            token
        })
    } catch (err) {
        next(err)
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            throw new ApiError(400, 'Email and password are required')
        }

        const user = await userRepo.findByEmail(email)
        if (!user) {
            throw new ApiError(401, 'Invalid credentials')
        }

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            throw new ApiError(401, 'Invalid credentials')
        }

        const token = signToken(user)
        res.json({
            user: { id: user.id, email: user.email, role: user.role },
            token
        })
    } catch (err) {
        next(err)
    }
}

export async function me(req, res, next) {
    try {
        const user = await userRepo.findById(req.user.id)
        if (!user) {
            throw new ApiError(404, 'User not found')
        }
        res.json({ id: user.id, email: user.email, role: user.role })
    } catch (err) {
        next(err)
    }
}
