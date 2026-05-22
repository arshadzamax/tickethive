import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import BookingPanel from '../features/booking/BookingPanel.tsx'
import { useSeatSocketInit } from '../hooks/useSeatSocket'
import { fetchEvents, selectAllEvents, selectEventsLoading } from '../features/events/eventSlice'
import { fetchSeats } from '../features/seats/seatSlice'
import api from '../services/apiClient'

type PricingRule = {
  type: 'surge' | 'early_bird'
  label: string
}

type EffectivePriceResponse = {
  normalPrice?: number
  premiumPrice?: number
  appliedRules?: PricingRule[]
}

function formatDate(dateStr: string | number | Date | null | undefined) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BookingPage() {
  const { eventId } = useParams<{ eventId: string }>()
  useSeatSocketInit(eventId)

  const dispatch = useDispatch()
  const events = useSelector(selectAllEvents)
  const loading = useSelector(selectEventsLoading)
  const [effectivePrices, setEffectivePrices] = useState<EffectivePriceResponse | null>(null)

  // Fetch events if the store is empty (e.g. user navigated directly to this URL)
  useEffect(() => {
    if (events.length === 0) {
      dispatch(fetchEvents())
    }
  }, [dispatch, events.length])

  // Fetch seats for this event
  useEffect(() => {
    if (eventId) {
      dispatch(fetchSeats(eventId))
    }
  }, [dispatch, eventId])

  // Fetch effective (dynamic) pricing
  useEffect(() => {
    if (!eventId) return
    api.get(`/events/${eventId}/effective-price`)
      .then(r => setEffectivePrices(r.data as EffectivePriceResponse))
      .catch(() => {})
  }, [eventId])

  const event = events.find(e => String(e.id) === String(eventId))

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Event Details Banner */}
      <div className="rounded-xl bg-neutral-800/60 border border-neutral-700/50 backdrop-blur-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="px-5 py-4">
          {loading && !event && (
            <div className="text-sm text-neutral-400 animate-pulse">Loading event details…</div>
          )}
          {event ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎪</span>
                <div>
                  <h1 className="text-xl font-bold text-neutral-100">{event.name}</h1>
                  {event.organiser && (
                    <p className="text-sm text-neutral-400 mt-0.5">
                      <span className="mr-1">👤</span>{event.organiser}
                    </p>
                  )}
                </div>
              </div>
              {event.date && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 whitespace-nowrap">
                  <span>📅</span>
                  <span>{formatDate(event.date)}</span>
                </div>
              )}
            </div>
          ) : !loading && (
            <div className="text-sm text-neutral-500">Event details unavailable.</div>
          )}
        </div>
      </div>

      {/* Dynamic pricing alerts */}
      {effectivePrices?.appliedRules?.map((rule, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            rule.type === 'surge'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <span className="text-base">{rule.type === 'surge' ? '🔥' : '🐦'}</span>
          <span>{rule.label}</span>
        </div>
      ))}

      {/* Booking Panel (contains seat selector + cart) */}
      <BookingPanel event={event} eventId={eventId} effectivePrices={effectivePrices} />
    </div>
  )
}

