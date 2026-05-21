import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAddonItem } from './bookingSlice'
import api from '../../services/apiClient'

export default function AddonsPanel({ eventId }) {
  const dispatch = useDispatch()
  const addonItems = useSelector(s => s.booking.addonItems)
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/events/${eventId}/addons`)
      .then(r => setAddons(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) return null
  if (addons.length === 0) return null

  const getQty = (addonId) => addonItems.find(a => a.addonId === addonId)?.quantity || 0

  const change = (addon, delta) => {
    const current = getQty(addon.id)
    const next = Math.max(0, current + delta)
    dispatch(setAddonItem({
      addonId: addon.id,
      name: addon.name,
      quantity: next,
      pricePerUnit: Number(addon.price),
    }))
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-violet-500/20 flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h3 className="text-sm font-semibold text-violet-300">Enhance Your Experience</h3>
        <span className="ml-auto text-xs text-violet-400/70">Optional add-ons</span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {addons.map(addon => {
          const qty = getQty(addon.id)
          return (
            <div
              key={addon.id}
              className={`rounded-lg border p-3 transition-all ${
                qty > 0
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-neutral-700/50 bg-neutral-800/40 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-100 truncate">{addon.name}</p>
                  {addon.description && (
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{addon.description}</p>
                  )}
                  <p className="text-sm font-bold text-violet-400 mt-1.5">
                    ₹{Number(addon.price).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Qty control */}
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <button
                    onClick={() => change(addon, -1)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-lg bg-neutral-700/60 text-neutral-300 hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-base font-bold transition"
                  >−</button>
                  <span className={`w-5 text-center text-sm font-bold ${qty > 0 ? 'text-violet-300' : 'text-neutral-500'}`}>
                    {qty}
                  </span>
                  <button
                    onClick={() => change(addon, +1)}
                    className="w-7 h-7 rounded-lg bg-violet-600/40 hover:bg-violet-600/60 text-violet-200 flex items-center justify-center text-base font-bold transition"
                  >+</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
