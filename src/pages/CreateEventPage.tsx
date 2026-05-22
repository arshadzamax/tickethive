import React, { useState, useEffect, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { createEvent, clearCreateError, selectCreating, selectCreateError } from '../features/events/eventSlice'
import { fetchVenues, selectAllVenues, selectVenuesLoading } from '../features/venues/venueSlice'
import { selectUser } from '../features/auth/authSlice'
import type { Event, Venue } from '../types'
import Layout from '../components/Layout.tsx'

const FIELD = 'block text-sm font-medium text-neutral-300 mb-1.5'
const INPUT = 'w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-neutral-600/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition'
const INPUT_ERR = 'w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-red-500/60 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 transition'

function clamp(v: string | number, min: number, max: number): number { return Math.max(min, Math.min(max, Number(v) || min)) }

type PricingRule =
  | { type: 'surge'; threshold: number; increase_pct: number }
  | { type: 'early_bird'; ends_at: string; discount_pct: number }

type EventForm = {
  name: string
  date: string
  time: string
  organiser: string
  venueId: string | number
  priceNormal: number
  pricePremium: number
}

type EventFormErrors = Partial<Record<keyof EventForm, string>>

export default function CreateEventPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector(selectUser)
    const creating = useSelector(selectCreating)
    const serverError = useSelector(selectCreateError)
    const venues = useSelector(selectAllVenues) as Venue[]
    const venuesLoading = useSelector(selectVenuesLoading)

    const organiserName = typeof user?.['email'] === 'string' ? user['email'].split('@')[0] : ''

    const [form, setForm] = useState<EventForm>({
        name: '',
        date: '',
        time: '',
        organiser: organiserName || '',
        venueId: '',
        priceNormal: 100,
        pricePremium: 150,
    })
    const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
    const [errors, setErrors] = useState<EventFormErrors>({})
    const [success, setSuccess] = useState<Event | null>(null)

    useEffect(() => { 
        dispatch(clearCreateError()) 
        dispatch(fetchVenues())
    }, [dispatch])

    const set = <K extends keyof EventForm>(field: K, value: EventForm[K]) => {
        setForm(f => ({ ...f, [field]: value }))
        setErrors(e => ({ ...e, [field]: undefined }))
    }

    const validate = (): EventFormErrors => {
        const e: EventFormErrors = {}
        if (!form.name.trim()) e.name = 'Event name is required'
        if (!form.date) e.date = 'Date is required'
        if (!form.time) e.time = 'Time is required'
        if (form.date && form.time) {
            const dt = new Date(`${form.date}T${form.time}`)
            if (dt <= new Date()) e.date = 'Date & time must be in the future'
        }
        if (!form.organiser.trim()) e.organiser = 'Organiser name is required'
        if (!form.venueId) e.venueId = 'Please select a venue'
        if (form.priceNormal < 1) e.priceNormal = 'Minimum price is ₹1'
        if (form.pricePremium < form.priceNormal) {
            e.pricePremium = 'Premium price must be ≥ normal price'
        }
        return e
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        const dateTime = new Date(`${form.date}T${form.time}`).toISOString()
        const payload = {
            name: form.name.trim(),
            date: dateTime,
            organiser: form.organiser.trim(),
            venueId: form.venueId,
            priceNormal: Number(form.priceNormal),
            pricePremium: Number(form.pricePremium),
            pricingRules,
        }

        const result = await dispatch(createEvent(payload))
        if (createEvent.fulfilled.match(result)) {
            setSuccess(result.payload)
        }
    }

    if (success) {
        return (
            <Layout>
                <div className="max-w-lg mx-auto text-center py-10 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-4xl animate-bounce-slow">
                        🎉
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Event Created!</h2>
                        <p className="text-neutral-400 text-sm">
                            <span className="text-emerald-400 font-semibold">"{success.name}"</span> is live.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/events" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20">
                            View All Events
                        </Link>
                        <button
                            onClick={() => { setSuccess(null); setForm(f => ({ ...f, name: '', date: '', time: '' })) }}
                            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition-all"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">🎪</div>
                        <h1 className="text-2xl font-bold text-neutral-100">Host an Event</h1>
                    </div>
                    <p className="text-sm text-neutral-400 ml-12">Fill in the details below to list your event on TicketHive.</p>
                </div>

                {serverError && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {serverError}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Event Name */}
                    <div>
                        <label className={FIELD}>Event Name <span className="text-red-400">*</span></label>
                        <input id="event-name" type="text" value={form.name} onChange={e => set('name', e.target.value)}
                            placeholder="e.g. Rock Fest 2026" className={errors.name ? INPUT_ERR : INPUT} maxLength={120} />
                        {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                    </div>

                    {/* Date + Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={FIELD}>Date <span className="text-red-400">*</span></label>
                            <input id="event-date" type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                                onChange={e => set('date', e.target.value)} className={errors.date ? INPUT_ERR : INPUT} />
                            {errors.date && <p className="mt-1.5 text-xs text-red-400">{errors.date}</p>}
                        </div>
                        <div>
                            <label className={FIELD}>Start Time <span className="text-red-400">*</span></label>
                            <input id="event-time" type="time" value={form.time} onChange={e => set('time', e.target.value)}
                                className={errors.time ? INPUT_ERR : INPUT} />
                            {errors.time && <p className="mt-1.5 text-xs text-red-400">{errors.time}</p>}
                        </div>
                    </div>

                    {/* Organiser */}
                    <div>
                        <label className={FIELD}>Organiser / Host Name <span className="text-red-400">*</span></label>
                        <input id="event-organiser" type="text" value={form.organiser} onChange={e => set('organiser', e.target.value)}
                            placeholder="Your name or organisation" className={errors.organiser ? INPUT_ERR : INPUT} maxLength={80} />
                        {errors.organiser && <p className="mt-1.5 text-xs text-red-400">{errors.organiser}</p>}
                    </div>

                    {/* Venue Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium text-neutral-300">Venue <span className="text-red-400">*</span></label>
                            <Link to="/venues/create" className="text-xs text-emerald-400 hover:text-emerald-300 transition">+ New Venue</Link>
                        </div>
                        {venuesLoading ? (
                            <div className="w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-neutral-600/50 text-neutral-500 animate-pulse">Loading venues...</div>
                        ) : venues.length === 0 ? (
                            <div className="w-full px-4 py-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200/80 text-sm text-center">
                                No venues available. <Link to="/venues/create" className="text-amber-400 font-semibold hover:underline">Create a venue first.</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {venues.map(venue => (
                                    <button key={venue.id} type="button" onClick={() => set('venueId', venue.id)}
                                        className={`p-4 rounded-xl border-2 transition text-left ${
                                            form.venueId === venue.id
                                                ? 'border-emerald-500/60 bg-emerald-500/10'
                                                : 'border-neutral-700/50 bg-neutral-800/30 hover:border-neutral-600'
                                        }`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-neutral-200">{venue.name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-neutral-700/50 text-neutral-300">{venue.type}</span>
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Capacity: {venue.total_capacity} {venue.type === 'SEATED' ? `(${venue.rows}×${venue.cols})` : ''}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {errors.venueId && <p className="mt-1.5 text-xs text-red-400">{errors.venueId}</p>}
                    </div>

                    {/* Pricing */}
                    <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/30 p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">💰</span>
                            <h3 className="text-sm font-semibold text-neutral-200">Ticket Pricing</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={FIELD}>Normal Price (₹)</label>
                                <input id="price-normal" type="number" min={1} step={1} value={form.priceNormal}
                                    onChange={e => set('priceNormal', Math.max(1, Number(e.target.value) || 1))}
                                    className={errors.priceNormal ? INPUT_ERR : INPUT} />
                                {errors.priceNormal && <p className="mt-1.5 text-xs text-red-400">{errors.priceNormal}</p>}
                            </div>
                            <div>
                                <label className={FIELD}>Premium Price (₹)</label>
                                <input id="price-premium" type="number" min={1} step={1} value={form.pricePremium}
                                    onChange={e => set('pricePremium', Math.max(1, Number(e.target.value) || 1))}
                                    className={errors.pricePremium ? INPUT_ERR : INPUT} />
                                {errors.pricePremium && <p className="mt-1.5 text-xs text-red-400">{errors.pricePremium}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Pricing Rules */}
                    <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/30 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-base">📈</span>
                            <h3 className="text-sm font-semibold text-neutral-200">Dynamic Pricing Rules</h3>
                            <span className="ml-auto text-xs text-neutral-500">Optional</span>
                        </div>
                        <p className="text-xs text-neutral-400">Rules are evaluated at booking time and applied multiplicatively.</p>

                        {/* Existing rules */}
                        <div className="space-y-2">
                            {pricingRules.map((rule, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700/40 border border-neutral-600/40 text-sm">
                                    {rule.type === 'surge' ? (
                                        <span className="text-red-300">🔥 Surge: +{rule.increase_pct}% when {rule.threshold}% sold</span>
                                    ) : (
                                        <span className="text-emerald-300">🐦 Early bird: −{rule.discount_pct}% until {rule.ends_at?.slice(0, 10)}</span>
                                    )}
                                    <button type="button" onClick={() => setPricingRules(r => r.filter((_, j) => j !== i))}
                                        className="ml-auto text-neutral-500 hover:text-red-400 transition text-xs">✕ Remove</button>
                                </div>
                            ))}
                        </div>

                        {/* Add surge rule */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button type="button"
                                onClick={() => {
                                    const threshold = parseFloat(prompt('Surge threshold % sold (e.g. 80):', '80') ?? '80')
                                    const pct = parseFloat(prompt('Price increase % (e.g. 15):', '15') ?? '15')
                                    if (!isNaN(threshold) && !isNaN(pct) && threshold > 0 && pct > 0) {
                                        setPricingRules(r => [...r, { type: 'surge', threshold, increase_pct: pct }])
                                    }
                                }}
                                className="px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 text-xs font-medium transition flex items-center justify-center gap-2"
                            >
                                🔥 Add Surge Rule
                            </button>
                            <button type="button"
                                onClick={() => {
                                    const date = prompt('Early bird ends on (YYYY-MM-DD):', new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))
                                    const pct = parseFloat(prompt('Discount % (e.g. 20):', '20') ?? '20')
                                    if (date && !isNaN(pct) && pct > 0 && pct <= 100) {
                                        setPricingRules(r => [...r, { type: 'early_bird', ends_at: date + 'T23:59:59Z', discount_pct: pct }])
                                    }
                                }}
                                className="px-4 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-medium transition flex items-center justify-center gap-2"
                            >
                                🐦 Add Early Bird Rule
                            </button>
                        </div>
                    </div>

                    {/* Venue details logic removed */}

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button id="create-event-submit" type="submit" disabled={creating}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/20">
                            {creating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Creating…
                                </span>
                            ) : 'Create Event'}
                        </button>
                        <Link to="/events" className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition-all text-sm font-medium">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </Layout>
    )
}
