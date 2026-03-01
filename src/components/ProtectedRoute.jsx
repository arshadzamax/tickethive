import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { selectUser, selectAuthInitialized } from '../features/auth/authSlice.js'

export default function ProtectedRoute({ children, requiredRole }) {
    const user = useSelector(selectUser)
    const initialized = useSelector(selectAuthInitialized)

    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071024] via-[#0b1a3a] to-[#03040a]">
                <div className="text-neutral-400 text-sm animate-pulse">Loading…</div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/booking" replace />
    }

    return children
}
