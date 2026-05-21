import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setEventType } from './bookingSlice'
import MultiSeatSelector from '../../components/booking/MultiSeatSelector'
import GeneralTicketBooking from '../../components/booking/GeneralTicketBooking'
import BookingCart from '../../components/booking/BookingCart'
import AddonsPanel from './AddonsPanel'

export default function BookingPanel({ event, eventId, effectivePrices }) {
  const dispatch = useDispatch()
  const eventType = event?.event_type || 'SEATED'
  const booking = useSelector(state => state.booking)
  const seatsLocked = booking.holdingStatus === 'success'

  useEffect(() => {
    dispatch(setEventType(eventType))
  }, [eventType, dispatch])

  // Use effective prices if available, else fall back to event prices
  const normalPrice = effectivePrices?.normalPrice ?? event?.price_normal
  const premiumPrice = effectivePrices?.premiumPrice ?? event?.price_premium

  if (!event) {
    return (
      <div className="rounded-lg bg-neutral-800 p-6 text-center">
        <div className="text-neutral-400">Loading event details...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Main Booking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {eventType === 'SEATED' ? (
            <MultiSeatSelector
              eventId={eventId}
              eventType={eventType}
              premiumPrice={premiumPrice}
              normalPrice={normalPrice}
              premiumRows={event.premium_rows || []}
            />
          ) : (
            <GeneralTicketBooking
              event={event}
              eventType={eventType}
              premiumPrice={premiumPrice}
              normalPrice={normalPrice}
            />
          )}

          {/* Add-ons: shown only once seats/tickets are locked */}
          {seatsLocked && <AddonsPanel eventId={eventId} />}
        </div>

        {/* Booking Cart Sidebar */}
        <div>
          <BookingCart event={event} eventType={eventType} effectivePrices={effectivePrices} />
        </div>
      </div>

      {/* Status Messages */}
      {booking.error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{booking.error}</p>
        </div>
      )}

      {seatsLocked && (
        <div className="p-4 bg-emerald-900/50 border border-emerald-700/50 rounded-lg text-emerald-200">
          <p className="font-semibold">✓ Items Successfully Held</p>
          <p className="text-sm">Your items are reserved for 5 minutes. Add extras above, then complete checkout.</p>
        </div>
      )}
    </div>
  )
}

