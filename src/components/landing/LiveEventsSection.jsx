import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchEvents, selectAllEvents, selectEventsLoading, selectEventsError } from '../../features/events/eventSlice.js'
import { selectUser, selectIsAdmin } from '../../features/auth/authSlice.js'
import ScrollReveal from './ScrollReveal.jsx'

const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const EVENT_EMOJIS = ['🎸', '🎭', '🎪', '🎤', '🎬', '🏟️', '🎶', '🎺']

export default function LiveEventsSection() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const events = useSelector(selectAllEvents)
    const loading = useSelector(selectEventsLoading)
    const error = useSelector(selectEventsError)
    const user = useSelector(selectUser)
    const isAdmin = useSelector(selectIsAdmin)

    useEffect(() => {
        dispatch(fetchEvents())
    }, [dispatch])

    const handleEventClick = (eventId) => {
        if (!user) {
            navigate('/login', { state: { from: `/events/${eventId}/booking` } })
        } else if (isAdmin) {
            navigate(`/events/${eventId}/admin`)
        } else {
            navigate(`/events/${eventId}/booking`)
        }
    }

    return (
        <section id="live-events" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
            <ScrollReveal>
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-xs font-semibold tracking-widest uppercase text-emerald-400">Live Events</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-neutral-100">
                        Upcoming <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Events</span>
                    </h2>
                    <p className="mt-3 text-neutral-400 max-w-md mx-auto">
                        Browse live events and book your seat instantly. No waiting, no double bookings.
                    </p>
                </div>
            </ScrollReveal>

            {/* Loading skeleton */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-xl bg-neutral-800/40 border border-neutral-700/40 p-5 animate-pulse space-y-3">
                            <div className="h-5 bg-neutral-700/60 rounded w-3/4" />
                            <div className="h-4 bg-neutral-700/40 rounded w-1/2" />
                            <div className="h-4 bg-neutral-700/40 rounded w-2/3" />
                            <div className="h-9 bg-neutral-700/30 rounded-lg mt-4" />
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="text-center py-10 text-sm text-red-400/80">
                    Could not load events. Please try again later.
                </div>
            )}

            {!loading && !error && events.length === 0 && (
                <div className="text-center py-14">
                    <div className="text-5xl mb-4">🎟️</div>
                    <p className="text-neutral-500 text-sm">No events available right now. Check back soon!</p>
                </div>
            )}

            {!loading && events.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map((event, idx) => (
                        <ScrollReveal key={event.id} delay={idx * 80}>
                            <div className="group relative overflow-hidden rounded-xl bg-neutral-800/50 border border-neutral-700/40 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 flex flex-col h-full">
                                {/* Top accent gradient */}
                                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="p-5 flex flex-col gap-3 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-base font-semibold text-neutral-100 group-hover:text-emerald-300 transition-colors leading-snug">
                                            {event.name}
                                        </h3>
                                        <span className="text-2xl flex-shrink-0">{EVENT_EMOJIS[idx % EVENT_EMOJIS.length]}</span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-neutral-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-neutral-500">📅</span>
                                            <span>{formatDate(event.date)}</span>
                                        </div>
                                        {event.organiser && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-neutral-500">👤</span>
                                                <span>{event.organiser}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-3">
                                        <button
                                            id={`event-book-${event.id}`}
                                            onClick={() => handleEventClick(event.id)}
                                            className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-emerald-400 hover:from-emerald-500 hover:to-cyan-500 hover:text-black hover:border-transparent hover:shadow-lg hover:shadow-emerald-500/20"
                                        >
                                            {user
                                                ? (isAdmin ? 'Manage Event →' : 'Book Seats →')
                                                : 'Sign In to Book →'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            )}

            {/* CTA for unauthenticated users */}
            {!user && !loading && events.length > 0 && (
                <ScrollReveal delay={200}>
                    <div className="mt-12 text-center">
                        <p className="text-xs text-neutral-500 mb-3">Free to browse. Sign in to reserve your spot.</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <a
                                href="/register"
                                className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
                            >
                                Create Free Account
                            </a>
                            <a
                                href="/login"
                                className="px-6 py-2.5 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/8 transition-all hover:-translate-y-0.5"
                            >
                                Sign In
                            </a>
                        </div>
                    </div>
                </ScrollReveal>
            )}
        </section>
    )
}
