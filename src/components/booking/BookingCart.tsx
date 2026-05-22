import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  holdBooking, createGroupBooking, releaseBooking,
  setPromoCode, setPromoValidation, applyDiscount
} from '../../features/booking/bookingSlice'
import { selectAllSeats } from '../../features/seats/seatSelectors'
import api from '../../services/apiClient'
import type { BookingCartProps, BookingItems, AddonItem } from '../../types'
import type { RootState } from '../../app/store'

const fmt = (n: number | null | undefined): string => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function BookingCart({ event, eventType, effectivePrices }: BookingCartProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const booking = useAppSelector((state: RootState) => state.booking)
  const seats = useAppSelector(selectAllSeats)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const selectedItems = Array.isArray(booking.selectedItems) ? booking.selectedItems : null
  const selectedTicket = !Array.isArray(booking.selectedItems) ? booking.selectedItems : null

  // -- Price computation --
  const effectiveNormal = effectivePrices?.normalPrice ?? Number(event?.price_normal)
  const effectivePremium = effectivePrices?.premiumPrice ?? Number(event?.price_premium)

  const calculateSeatedTotal = (): number => {
    if (eventType !== 'SEATED' || !Array.isArray(booking.selectedItems)) return 0
    return booking.selectedItems.reduce((sum: number, seatId: string | number) => {
      const seat = seats.find(s => s.id === seatId)
      const isPremium = seat?.category === 'PREMIUM' || (event?.premium_rows || []).includes(Number(seat?.row))
      return sum + (isPremium ? effectivePremium : effectiveNormal)
    }, 0)
  }

  const ticketSubtotal = eventType === 'SEATED'
    ? calculateSeatedTotal()
    : (booking.totalPrice || 0)

  const addonSubtotal = booking.addonItems.reduce((s: number, a: AddonItem) => s + a.quantity * a.pricePerUnit, 0)
  const grandTotal = Math.max(0, ticketSubtotal + addonSubtotal - (booking.discountAmount || 0))

  // -- Promo code --
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await api.post('/promo-codes/validate', { eventId: event.id, code: promoInput.trim() })
      if (res.data.valid) {
        dispatch(setPromoCode(promoInput.trim().toUpperCase()))
        dispatch(setPromoValidation(res.data))
        dispatch(applyDiscount({ ticketSubtotal }))
      } else {
        setPromoError(res.data.reason || 'Invalid code')
        dispatch(setPromoValidation(null))
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setPromoError(err.response?.data?.message || 'Failed to validate code')
    } finally {
      setPromoLoading(false)
    }
  }

  const clearPromo = () => {
    setPromoInput('')
    setPromoError('')
    dispatch(setPromoCode(''))
    dispatch(setPromoValidation(null))
  }

  // -- Booking actions --
  const handleHoldBooking = async () => {
    setIsSubmitting(true)
    try {
      if (!eventType) return
      const bookingItems: BookingItems = selectedItems
        ? { seats: selectedItems }
        : selectedTicket
          ? { quantity: selectedTicket.quantity, category: selectedTicket.category }
          : { quantity: 0, category: '' }
      await dispatch(holdBooking({ eventId: event.id, bookingItems })).unwrap()
    } catch (err: unknown) {
      console.error('Failed to hold booking:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmBooking = async () => {
    setIsSubmitting(true)
    try {
      const bookingItems: BookingItems = selectedItems
        ? { seats: selectedItems }
        : selectedTicket
          ? { quantity: selectedTicket.quantity, category: selectedTicket.category }
          : { quantity: 0, category: '' }

      const result = await dispatch(createGroupBooking({
        eventId: event.id,
        bookingItems,
        groupLockId: booking.groupLockId,
        addonItems: booking.addonItems.map(a => ({ addonId: a.addonId, quantity: a.quantity })),
        promoCode: booking.promoCode || null,
      })).unwrap()

      navigate(`/booking-success/${result.groupBookingId}`)
    } catch (err: unknown) {
      console.error('Failed to create booking:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasSelection = eventType === 'SEATED'
    ? Boolean(selectedItems && selectedItems.length > 0)
    : Boolean(selectedTicket?.quantity && selectedTicket.quantity > 0)

  const isLocked = !!booking.groupLockId

  if (!hasSelection) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/40 p-6 text-center">
        <div className="text-3xl mb-3">🛒</div>
        <p className="text-neutral-400 text-sm">
          {eventType === 'SEATED' ? 'Select seats to continue' : 'Select tickets to continue'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-800/60 backdrop-blur-sm overflow-hidden sticky top-4">
      {/* Header bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
      <div className="p-5">
        <h3 className="text-base font-bold text-neutral-100 mb-4 flex items-center gap-2">
          🛒 Booking Summary
        </h3>

        {/* Ticket lines */}
        <div className="space-y-2 pb-4 border-b border-neutral-700/50">
          {eventType === 'SEATED' ? (
            (selectedItems ?? []).map((seatId: string | number) => {
              const seat = seats.find(s => s.id === seatId)
              const isPremium = seat?.category === 'PREMIUM'
              return (
                <div key={seatId} className="flex justify-between text-sm">
                  <span className="text-neutral-300">
                    Row {seat?.row} Seat {seat?.number}
                    {isPremium && <span className="ml-1 text-amber-400 text-[10px] font-bold uppercase">★ Premium</span>}
                  </span>
                  <span className="text-neutral-200 font-medium">{fmt(isPremium ? effectivePremium : effectiveNormal)}</span>
                </div>
              )
            })
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-300">{selectedTicket?.quantity ?? 0}× {selectedTicket?.category?.toLowerCase() ?? 'ticket'} ticket</span>
              <span className="text-neutral-200 font-medium">{fmt(ticketSubtotal)}</span>
            </div>
          )}
        </div>

        {/* Add-ons summary */}
        {booking.addonItems.length > 0 && (
          <div className="space-y-1.5 py-3 border-b border-neutral-700/50">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Add-ons</p>
            {booking.addonItems.map(a => (
              <div key={a.addonId} className="flex justify-between text-sm">
                <span className="text-violet-300">{a.quantity}× {a.name}</span>
                <span className="text-neutral-200">{fmt(a.quantity * a.pricePerUnit)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Promo code input */}
        {isLocked && !booking.promoValidation && (
          <div className="py-3 border-b border-neutral-700/50">
            <p className="text-xs text-neutral-400 mb-2">Have a promo code?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError('') }}
                placeholder="e.g. SUMMER20"
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-neutral-700/60 border border-neutral-600/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
              />
              <button
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-600/30 disabled:opacity-40 transition"
              >
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
            {promoError && <p className="text-xs text-red-400 mt-1.5">{promoError}</p>}
          </div>
        )}

        {/* Promo applied banner */}
        {booking.promoValidation?.valid && (
          <div className="py-3 border-b border-neutral-700/50">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div>
                <span className="text-xs font-bold text-emerald-400">🏷 {booking.promoCode}</span>
                <p className="text-xs text-emerald-300 mt-0.5">
                  {booking.promoValidation.discountType === 'pct'
                    ? `${booking.promoValidation.discountValue}% off tickets`
                    : `₹${booking.promoValidation.discountValue} off tickets`}
                </p>
              </div>
              <button onClick={clearPromo} className="text-neutral-500 hover:text-neutral-300 text-sm ml-2">✕</button>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-emerald-400">Discount</span>
              <span className="text-emerald-400 font-semibold">−{fmt(booking.discountAmount)}</span>
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-center py-3">
          <span className="text-neutral-200 font-semibold">Total</span>
          <span className="text-2xl font-bold text-white">{fmt(grandTotal)}</span>
        </div>

        {/* Lock indicator */}
        {isLocked && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <span>⏱</span>
            <span>Items locked for 5 minutes</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5">
          {!isLocked ? (
            <button
              onClick={handleHoldBooking}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              {isSubmitting ? 'Holding…' : '🔒 Hold Items (5 min)'}
            </button>
          ) : (
            <>
              <button
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? 'Processing…' : '✓ Confirm Booking'}
              </button>

              <button
                onClick={() => {
                  const bookingItems: BookingItems = selectedItems
                    ? { seats: selectedItems }
                    : selectedTicket
                      ? { quantity: selectedTicket.quantity, category: selectedTicket.category }
                      : { quantity: 0, category: '' }
                  dispatch(releaseBooking({
                    eventId: event.id,
                    groupLockId: booking.groupLockId,
                    bookingItems,
                  }))
                }}
                disabled={isSubmitting}
                className="w-full py-2 rounded-xl bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 text-sm font-medium transition border border-neutral-600/50"
              >
                Release & Change
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-neutral-500 mt-3 text-center">
          {isLocked
            ? '⏰ Complete checkout within 5 minutes to secure your booking.'
            : '📍 Lock items to proceed. Held seats are reserved for 5 minutes.'}
        </p>
      </div>
    </div>
  )
}
