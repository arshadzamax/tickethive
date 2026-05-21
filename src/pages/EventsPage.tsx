import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchEvents, selectAllEvents, selectEventsLoading, selectEventsError } from '../features/events/eventSlice.js'
import { selectUser, selectIsAdmin } from '../features/auth/authSlice.js'
import Layout from '../components/Layout.jsx'

export default function EventsPage() {
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
        } else {
            navigate(isAdmin ? `/events/${eventId}/admin` : `/events/${eventId}/booking`)
        }
    }

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

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-100">Events</h1>
                    <p className="text-sm text-neutral-400 mt-1">Select an event to view seats and make bookings</p>
                </div>

                {loading && (
                    <div className="text-sm text-neutral-400 animate-pulse">Loading events…</div>
                )}

                {error && (
                    <div className="text-sm text-red-400">Error: {error}</div>
                )}

                {!loading && events.length === 0 && (
                    <div className="text-sm text-neutral-500">No events available.</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map(event => {
                        const isExpired = new Date(event.date) < new Date()
                        const canClick = !isExpired || isAdmin
                        return (
                            <button
                                key={event.id}
                                onClick={() => canClick && handleEventClick(event.id)}
                                disabled={!canClick}
                                className={`group relative overflow-hidden rounded-xl bg-neutral-800/60 border p-5 backdrop-blur-sm text-left transition-all ${isExpired ? 'border-neutral-700/30 opacity-55 cursor-not-allowed' : 'border-neutral-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {!isExpired && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className={`text-lg font-semibold transition-colors ${isExpired ? 'text-neutral-400' : 'text-neutral-100 group-hover:text-emerald-400'}`}>
                                            {event.name}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {isExpired && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-red-500/15 border border-red-500/25 text-red-400">
                                                    Expired
                                                </span>
                                            )}
                                            <span className="text-xl">🎪</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-sm text-neutral-400">
                                        <div className="flex items-center gap-2">
                                            <span>📅</span>
                                            <span className={isExpired ? 'line-through text-neutral-500' : ''}>{formatDate(event.date)}</span>
                                        </div>
                                        {event.organiser && (
                                            <div className="flex items-center gap-2">
                                                <span>👤</span>
                                                <span>{event.organiser}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-2">
                                        <span className={`text-xs font-medium transition-colors ${isExpired ? 'text-red-400/60' : 'text-emerald-400/80 group-hover:text-emerald-300'}`}>
                                            {isExpired
                                                ? (isAdmin ? 'Manage Event →' : 'Event Ended')
                                                : (!user ? 'Sign In to Book →' : isAdmin ? 'Manage Event →' : 'View Seats →')}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </Layout>
    )
}
