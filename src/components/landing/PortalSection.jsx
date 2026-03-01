import React from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from './ScrollReveal.jsx'

export default function PortalSection() {
    return (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
            <ScrollReveal>
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-bold text-neutral-100">
                        Choose Your <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Portal</span>
                    </h2>
                    <p className="mt-3 text-neutral-400 max-w-lg mx-auto">Whether you're booking tickets or managing a venue, we've got you covered.</p>
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Attendee Portal */}
                <ScrollReveal delay={0}>
                    <div className="group relative h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all duration-300">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-4xl mb-4">🎫</div>
                        <h3 className="text-xl font-bold text-neutral-100 mb-2">Attendee Portal</h3>
                        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                            Browse events, pick your seat from the interactive map, and book instantly with real-time availability.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link to="/login" className="w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5">
                                Sign In
                            </Link>
                            <Link to="/register" className="w-full text-center px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 font-medium hover:bg-white/10 transition-all hover:-translate-y-0.5">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Admin Portal */}
                <ScrollReveal delay={150}>
                    <div className="group relative h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 hover:bg-white/[0.04] hover:border-purple-500/30 transition-all duration-300">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-purple-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-4xl mb-4">🛡️</div>
                        <h3 className="text-xl font-bold text-neutral-100 mb-2">Admin Portal</h3>
                        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                            Manage your venue with full control — resize seat grids, lock seats, reset bookings, and monitor live statistics.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link to="/login" className="w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-semibold hover:from-purple-400 hover:to-violet-400 transition-all shadow-lg shadow-purple-500/20 hover:-translate-y-0.5">
                                Admin Sign In
                            </Link>
                            <div className="text-center text-xs text-neutral-500 py-2">Requires admin credentials</div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    )
}
