import React, { useState, useEffect, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { createVenue, clearCreateError, selectCreatingVenue, selectCreateVenueError } from '../features/venues/venueSlice'
import type { Venue } from '../types'
import Layout from '../components/Layout.tsx'

const FIELD = 'block text-sm font-medium text-neutral-300 mb-1.5'
const INPUT = 'w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-neutral-600/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition'
const INPUT_ERR = 'w-full px-4 py-3 rounded-lg bg-neutral-800/60 border border-red-500/60 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 transition'

function clamp(v: string | number, min: number, max: number) { return Math.max(min, Math.min(max, Number(v) || min)) }

type VenueForm = {
  name: string
  type: 'SEATED' | 'GENERAL'
  rows: number
  cols: number
  defaultPremiumRows: number[]
  totalCapacity: number
}

type VenueFormErrors = Partial<Record<keyof VenueForm, string>>

export default function CreateVenuePage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const creating = useSelector(selectCreatingVenue)
    const serverError = useSelector(selectCreateVenueError)

    const [form, setForm] = useState<VenueForm>({
        name: '',
        type: 'SEATED',
        rows: 5,
        cols: 10,
        defaultPremiumRows: [],
        totalCapacity: 500,
    })
    const [errors, setErrors] = useState<VenueFormErrors>({})
    const [success, setSuccess] = useState<Venue | null>(null)

    useEffect(() => { dispatch(clearCreateError()) }, [dispatch])

    const set = <K extends keyof VenueForm>(field: K, value: VenueForm[K]) => {
        setForm(f => ({ ...f, [field]: value }))
        setErrors(e => ({ ...e, [field]: undefined }))
    }

    const togglePremiumRow = (row: number) => {
        setForm(f => {
            const current = f.defaultPremiumRows || []
            return {
                ...f,
                defaultPremiumRows: current.includes(row)
                    ? current.filter(r => r !== row)
                    : [...current, row].sort((a, b) => a - b)
            }
        })
    }

    const validate = (): VenueFormErrors => {
        const e: VenueFormErrors = {}
        if (!form.name.trim()) e.name = 'Venue name is required'
        return e
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }

        const payload: Record<string, unknown> = {
            name: form.name.trim(),
            type: form.type,
        }

        if (form.type === 'SEATED') {
            payload['rows'] = clamp(form.rows, 1, 20)
            payload['cols'] = clamp(form.cols, 1, 30)
            payload['defaultPremiumRows'] = form.defaultPremiumRows
        } else {
            payload['totalCapacity'] = clamp(form.totalCapacity, 50, 100000)
        }

        const result = await dispatch(createVenue(payload))
        if (createVenue.fulfilled.match(result)) {
            setSuccess(result.payload)
        }
    }

    const totalRows = clamp(form.rows, 1, 20)
    const totalCols = clamp(form.cols, 1, 30)
    const totalSeats = totalRows * totalCols
    const premiumCount = form.defaultPremiumRows.length * totalCols
    const normalCount = totalSeats - premiumCount

    if (success) {
        return (
            <Layout>
                <div className="max-w-lg mx-auto text-center py-10 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-4xl animate-bounce-slow">
                        🏢
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Venue Created!</h2>
                        <p className="text-neutral-400 text-sm">
                            <span className="text-emerald-400 font-semibold">"{success.name}"</span> has been added to your venues.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/events/create" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/20">
                            Create Event Here
                        </Link>
                        <button
                            onClick={() => { setSuccess(null); setForm(f => ({ ...f, name: '' })) }}
                            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition-all"
                        >
                            Create Another Venue
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">🏢</div>
                        <h1 className="text-2xl font-bold text-neutral-100">Create a Venue</h1>
                    </div>
                    <p className="text-sm text-neutral-400 ml-12">Define the physical layout and capacity of a venue, then use it to host events.</p>
                </div>

                {serverError && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {serverError}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* Venue Name */}
                    <div>
                        <label className={FIELD}>Venue Name <span className="text-red-400">*</span></label>
                        <input id="venue-name" type="text" value={form.name} onChange={e => set('name', e.target.value)}
                            placeholder="e.g. Madison Square Garden" className={errors.name ? INPUT_ERR : INPUT} maxLength={120} />
                        {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                    </div>

                    {/* Venue Type */}
                    <div>
                        <label className={FIELD}>Layout Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['SEATED', 'GENERAL'] as const).map(type => (
                                <button key={type} type="button" onClick={() => set('type', type)}
                                    className={`p-4 rounded-xl border-2 transition text-left ${
                                        form.type === type
                                            ? 'border-emerald-500/60 bg-emerald-500/10'
                                            : 'border-neutral-700/50 bg-neutral-800/30 hover:border-neutral-600'
                                    }`}>
                                    <span className="text-2xl block mb-1">{type === 'SEATED' ? '💺' : '🎟️'}</span>
                                    <span className="text-sm font-semibold text-neutral-200">{type === 'SEATED' ? 'Seated' : 'General Admission'}</span>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {type === 'SEATED' ? 'Assigned seats in a grid layout' : 'Open capacity, no assigned seats'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Venue Config — SEATED */}
                    {form.type === 'SEATED' && (
                        <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/30 p-5 space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🪑</span>
                                <h3 className="text-sm font-semibold text-neutral-200">Venue Seat Grid</h3>
                                <span className="ml-auto text-xs text-neutral-500">Max 20×30</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={FIELD}>Rows</label>
                                    <input id="venue-rows" type="number" min={1} max={20} value={form.rows}
                                        onChange={e => {
                                            const newRows = clamp(e.target.value, 1, 20)
                                            set('rows', newRows)
                                            setForm(f => ({ ...f, rows: newRows, defaultPremiumRows: f.defaultPremiumRows.filter(r => r <= newRows) }))
                                        }}
                                        className={INPUT} />
                                </div>
                                <div>
                                    <label className={FIELD}>Seats per Row</label>
                                    <input id="venue-cols" type="number" min={1} max={30} value={form.cols}
                                        onChange={e => set('cols', clamp(e.target.value, 1, 30))}
                                        className={INPUT} />
                                </div>
                            </div>

                            {/* Capacity summary */}
                            <div className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-900/40 rounded-lg px-4 py-2.5">
                                <span>Total capacity</span>
                                <div className="flex items-center gap-4">
                                    {premiumCount > 0 && (
                                        <span className="text-amber-400 font-semibold">{premiumCount} premium</span>
                                    )}
                                    <span className="text-emerald-400 font-semibold">{normalCount} normal</span>
                                    <span className="text-white font-bold">{totalSeats} total</span>
                                </div>
                            </div>

                            {/* Premium Row Selector */}
                            <div>
                                <label className={FIELD}>Default Premium Rows <span className="text-neutral-500 font-normal">(click to toggle)</span></label>
                                <p className="text-xs text-neutral-500 mb-3">Select which rows should default to premium pricing for events held here.</p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: totalRows }, (_, i) => i + 1).map(row => {
                                        const isPremium = form.defaultPremiumRows.includes(row)
                                        return (
                                            <button key={row} type="button" onClick={() => togglePremiumRow(row)}
                                                className={`w-16 py-2 rounded-lg text-sm font-semibold transition border-2 ${
                                                    isPremium
                                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10'
                                                        : 'bg-neutral-800/60 border-neutral-600/40 text-neutral-400 hover:border-neutral-500'
                                                }`}>
                                                Row {row}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Venue Config — GENERAL */}
                    {form.type === 'GENERAL' && (
                        <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/30 p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🎟️</span>
                                <h3 className="text-sm font-semibold text-neutral-200">Ticket Capacity</h3>
                            </div>
                            <div>
                                <label className={FIELD}>Total Capacity</label>
                                <input id="venue-capacity" type="number" min={50} max={100000} value={form.totalCapacity}
                                    onChange={e => set('totalCapacity', clamp(e.target.value, 50, 100000))}
                                    className={INPUT} />
                                <p className="text-xs text-neutral-500 mt-1.5">Maximum number of attendees this venue can hold</p>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={creating}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/20">
                            {creating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Creating…
                                </span>
                            ) : 'Create Venue'}
                        </button>
                        <button type="button" onClick={() => navigate(-1)} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 transition-all text-sm font-medium">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}
