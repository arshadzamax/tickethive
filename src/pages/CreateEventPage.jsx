import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { createEvent, clearCreateError, selectCreating, selectCreateError } from '../features/events/eventSlice.js'
import { selectUser } from '../features/auth/authSlice.js'
import Layout from '../components/Layout.jsx'

const FIELD = 'block text-sm font-medium text-neutral-300 mb-1.5'
const INPUT = 'w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-neutral-600/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition'
const INPUT_ERR = 'w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-red-500/60 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 transition'

function clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || min)) }

export default function CreateEventPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const user = useSelector(selectUser)
    const creating = useSelector(selectCreating)
    const serverError = useSelector(selectCreateError)

    const [form, setForm] = useState({
        name: '',
        date: '',
        time: '',
        organiser: user?.email?.split('@')[0] || '',
        rows: 5,
        cols: 10,
    })
    const [errors, setErrors] = useState({})
    const [success, setSuccess] = useState(null)

    useEffect(() => {
        dispatch(clearCreateError())
    }, [dispatch])

    const set = (field, value) => {
        setForm(f => ({ ...f, [field]: value }))
        setErrors(e => ({ ...e, [field]: undefined }))
    }

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Event name is required'
        if (!form.date) e.date = 'Date is required'
        if (!form.time) e.time = 'Time is required'
        if (form.date && form.time) {
            const dt = new Date(`${form.date}T${form.time}`)
            if (dt <= new Date()) e.date = 'Date & time must be in the future'
        }
        if (!form.organiser.trim()) e.organiser = 'Organiser name is required'
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        const dateTime = new Date(`${form.date}T${form.time}`).toISOString()

        const result = await dispatch(createEvent({
            name: form.name.trim(),
            date: dateTime,
            organiser: form.organiser.trim(),
            rows: clamp(form.rows, 1, 20),
            cols: clamp(form.cols, 1, 30),
        }))

        if (createEvent.fulfilled.match(result)) {
            setSuccess(result.payload)
        }
    }

    const totalSeats = clamp(form.rows, 1, 20) * clamp(form.cols, 1, 30)

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
                            <span className="text-emerald-400 font-semibold">"{success.name}"</span> is live with{' '}
                            <span className="text-emerald-400 font-semibold">{success.seats} seats</span> ready to book.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/events"
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            View All Events
                        </Link>
                        <button
                            onClick={() => { setSuccess(null); setForm({ name: '', date: '', time: '', organiser: user?.email?.split('@')[0] || '', rows: 5, cols: 10 }) }}
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

                {/* Server error */}
                {serverError && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        ⚠️ {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Event Name */}
                    <div>
                        <label className={FIELD}>Event Name <span className="text-red-400">*</span></label>
                        <input
                            id="event-name"
                            type="text"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="e.g. Rock Fest 2026"
                            className={errors.name ? INPUT_ERR : INPUT}
                            maxLength={120}
                        />
                        {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                    </div>

                    {/* Date + Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={FIELD}>Date <span className="text-red-400">*</span></label>
                            <input
                                id="event-date"
                                type="date"
                                value={form.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => set('date', e.target.value)}
                                className={errors.date ? INPUT_ERR : INPUT}
                            />
                            {errors.date && <p className="mt-1.5 text-xs text-red-400">{errors.date}</p>}
                        </div>
                        <div>
                            <label className={FIELD}>Start Time <span className="text-red-400">*</span></label>
                            <input
                                id="event-time"
                                type="time"
                                value={form.time}
                                onChange={e => set('time', e.target.value)}
                                className={errors.time ? INPUT_ERR : INPUT}
                            />
                            {errors.time && <p className="mt-1.5 text-xs text-red-400">{errors.time}</p>}
                        </div>
                    </div>

                    {/* Organiser */}
                    <div>
                        <label className={FIELD}>Organiser / Host Name <span className="text-red-400">*</span></label>
                        <input
                            id="event-organiser"
                            type="text"
                            value={form.organiser}
                            onChange={e => set('organiser', e.target.value)}
                            placeholder="Your name or organisation"
                            className={errors.organiser ? INPUT_ERR : INPUT}
                            maxLength={80}
                        />
                        {errors.organiser && <p className="mt-1.5 text-xs text-red-400">{errors.organiser}</p>}
                    </div>

                    {/* Seat Grid */}
                    <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/30 p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">🪑</span>
                            <h3 className="text-sm font-semibold text-neutral-200">Venue Seat Grid</h3>
                            <span className="ml-auto text-xs text-neutral-500">Max 20 rows × 30 cols</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={FIELD}>Rows</label>
                                <input
                                    id="event-rows"
                                    type="number"
                                    min={1} max={20}
                                    value={form.rows}
                                    onChange={e => set('rows', clamp(e.target.value, 1, 20))}
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <label className={FIELD}>Seats per Row</label>
                                <input
                                    id="event-cols"
                                    type="number"
                                    min={1} max={30}
                                    value={form.cols}
                                    onChange={e => set('cols', clamp(e.target.value, 1, 30))}
                                    className={INPUT}
                                />
                            </div>
                        </div>
                        {/* Preview bar */}
                        <div className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-900/40 rounded-lg px-4 py-2.5">
                            <span>Total capacity</span>
                            <span className="text-emerald-400 font-bold text-sm">{totalSeats} seats</span>
                        </div>
                        {/* Mini visual preview */}
                        <div className="overflow-auto max-h-28 mt-1">
                            <div className="flex flex-col gap-0.5" style={{ width: 'fit-content' }}>
                                {Array.from({ length: Math.min(clamp(form.rows, 1, 20), 8) }).map((_, r) => (
                                    <div key={r} className="flex gap-0.5">
                                        {Array.from({ length: Math.min(clamp(form.cols, 1, 30), 20) }).map((_, c) => (
                                            <div key={c} className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/20" />
                                        ))}
                                        {clamp(form.cols, 1, 30) > 20 && (
                                            <div className="w-3 h-3 flex items-center justify-center text-[7px] text-neutral-500">…</div>
                                        )}
                                    </div>
                                ))}
                                {clamp(form.rows, 1, 20) > 8 && (
                                    <div className="text-[9px] text-neutral-500 mt-0.5">+ {clamp(form.rows, 1, 20) - 8} more rows</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button
                            id="create-event-submit"
                            type="submit"
                            disabled={creating}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/20"
                        >
                            {creating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Creating…
                                </span>
                            ) : 'Create Event'}
                        </button>
                        <Link
                            to="/events"
                            className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition-all text-sm font-medium"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </Layout>
    )
}
