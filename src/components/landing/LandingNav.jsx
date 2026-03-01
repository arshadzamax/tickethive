import React from 'react'
import { Link } from 'react-router-dom'

export default function LandingNav() {
    return (
        <nav className="relative z-10 border-b border-white/5">
            <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
                <div className="th-brand text-2xl tracking-tight">TicketHive</div>
                <div className="flex items-center gap-3">
                    <Link to="/login" className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition rounded-lg hover:bg-white/5">
                        Sign In
                    </Link>
                    <Link to="/register" className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    )
}
