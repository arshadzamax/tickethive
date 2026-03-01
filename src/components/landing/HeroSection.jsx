import React from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from './ScrollReveal.jsx'
import AnimatedSeatGrid from './AnimatedSeatGrid.jsx'

export default function HeroSection() {
    return (
        <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-16">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                {/* Hero text */}
                <div className="flex-1 text-center lg:text-left">
                    <ScrollReveal>
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm shadow-lg shadow-black/20">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500/30 animate-ping" />
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            </div>
                            <div className="w-px h-3.5 bg-white/10" />
                            <span className="text-xs tracking-widest uppercase text-neutral-300/80 font-medium">
                                Real-Time Seat Allocation Engine
                            </span>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={100}>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                            <span className="block text-neutral-100">Book Your Perfect Seat,</span>
                            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                In Real-Time.
                            </span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal delay={200}>
                        <p className="mt-5 text-base sm:text-lg text-neutral-400 max-w-lg leading-relaxed lg:mx-0 mx-auto">
                            Experience concurrency-safe, real-time seat booking with optimistic UI,
                            distributed locking, and instant WebSocket broadcasts.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={300}>
                        <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <Link
                                to="/register"
                                className="group px-7 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                            >
                                Get Started Free
                                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                            </Link>
                            <Link to="/login" className="px-7 py-3 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-neutral-200 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                                Sign In
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Animated seat grid in fake browser window */}
                <ScrollReveal delay={200} className="flex-shrink-0 w-full max-w-md lg:max-w-lg">
                    <div className="hero-grid-card rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
                        {/* Fake browser chrome */}
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                            <div className="ml-3 flex-1 h-5 rounded-md bg-white/5 flex items-center px-3">
                                <span className="text-[10px] text-neutral-600">tickethive.app/booking</span>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6">
                            <AnimatedSeatGrid />
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* Stats bar */}
            <ScrollReveal delay={400}>
                <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16 text-center">
                    {[
                        { value: '< 16ms', label: 'UI Response' },
                        { value: '100%', label: 'Real-Time Sync' },
                        { value: '0', label: 'Double Bookings' }
                    ].map(stat => (
                        <div key={stat.label}>
                            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{stat.value}</div>
                            <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </ScrollReveal>
        </section>
    )
}
