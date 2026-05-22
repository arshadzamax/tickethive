import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as userRepo from '../repositories/user.repo.js'
import ApiError from '../utils/ApiError.js'
import { requireUser } from '../utils/params.js'
import env from '../config/env.js'
import type { Request, Response, NextFunction } from 'express'
import { registerSchema, loginSchema } from '../utils/schemas.js'
import type { ApiResponse } from '../types/response.js'

interface TokenPayload {
  id: string | number
  role?: string
  email?: string
}

function signToken(user: { id: string | number; role?: string; email?: string }): string {
    const payload: TokenPayload = { id: user.id, role: user.role, email: user.email }
    return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' })
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = registerSchema.parse(req.body)

        const existing = await userRepo.findByEmail(email)
        if (existing) {
            throw new ApiError(409, 'Email already registered')
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await userRepo.createUser({ email, passwordHash })
        const token = signToken(user)

        res.status(201).json({
            success: true,
            data: {
                user: { id: user.id, email: user.email, role: user.role },
                token
            }
        } satisfies ApiResponse<any>)
    } catch (err) {
        next(err)
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = loginSchema.parse(req.body)

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
            success: true,
            data: {
                user: { id: user.id, email: user.email, role: user.role },
                token
            }
        } satisfies ApiResponse<any>)
    } catch (err) {
        next(err)
    }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const currentUser = requireUser(req)
        const user = await userRepo.findById(String(currentUser.id))
        if (!user) {
            throw new ApiError(404, 'User not found')
        }
        res.json({
            success: true,
            data: { id: user.id, email: user.email, role: user.role }
        } satisfies ApiResponse<any>)
    } catch (err) {
        next(err)
    }
}
