import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser, selectAuthLoading, selectAuthError, selectUser, clearAuthError } from '../features/auth/authSlice.js'

export default function LoginPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector(selectUser)
    const loading = useSelector(selectAuthLoading)
    const error = useSelector(selectAuthError)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        dispatch(clearAuthError())
    }, [dispatch])

    useEffect(() => {
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/booking', { replace: true })
        }
    }, [user, navigate])

    const onSubmit = (e) => {
        e.preventDefault()
        dispatch(loginUser({ email, password }))
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071024] via-[#0b1a3a] to-[#03040a]">
            <div className="w-full max-w-md p-8 rounded-2xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        TicketHive
                    </h1>
                    <p className="text-neutral-400 text-sm mt-2">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-neutral-600/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-neutral-600/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-neutral-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
