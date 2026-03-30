import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchEvents, selectAllEvents, selectEventsLoading, selectEventsError } from '../features/events/eventSlice.js'
import { selectIsAdmin } from '../features/auth/authSlice.js'
import Layout from '../components/Layout.jsx'

export default function EventsPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const events = useSelector(selectAllEvents)
    const loading = useSelector(selectEventsLoading)
    const error = useSelector(selectEventsError)
    const isAdmin = useSelector(selectIsAdmin)

    useEffect(() => {
        dispatch(fetchEvents())
    }, [dispatch])

    const handleEventClick = (eventId) => {
        navigate(isAdmin ? `/events/${eventId}/admin` : `/events/${eventId}/booking`)
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
                    {events.map(event => (
                        <button
                            key={event.id}
                            onClick={() => handleEventClick(event.id)}
                            className="group relative overflow-hidden rounded-xl bg-neutral-800/60 border border-neutral-700/50 p-5 backdrop-blur-sm text-left transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-lg font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                                        {event.name}
                                    </h3>
                                    <span className="text-xl">🎪</span>
                                </div>
                                <div className="space-y-1.5 text-sm text-neutral-400">
                                    <div className="flex items-center gap-2">
                                        <span>📅</span>
                                        <span>{formatDate(event.date)}</span>
                                    </div>
                                    {event.organiser && (
                                        <div className="flex items-center gap-2">
                                            <span>👤</span>
                                            <span>{event.organiser}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <span className="text-xs text-emerald-400/80 font-medium group-hover:text-emerald-300 transition-colors">
                                        {isAdmin ? 'Manage Event →' : 'View Seats →'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Layout>
    )
}
