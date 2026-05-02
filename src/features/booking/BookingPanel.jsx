import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setEventType } from './bookingSlice'
import MultiSeatSelector from '../../components/booking/MultiSeatSelector'
import GeneralTicketBooking from '../../components/booking/GeneralTicketBooking'
import BookingCart from '../../components/booking/BookingCart'

export default function BookingPanel({ event, eventId }) {
  const dispatch = useDispatch()
  const eventType = event?.event_type || 'SEATED'
  const booking = useSelector(state => state.booking)

  useEffect(() => {
    dispatch(setEventType(eventType))
  }, [eventType, dispatch])

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
        <div className="lg:col-span-2">
          {eventType === 'SEATED' ? (
            <MultiSeatSelector
              eventId={eventId}
              eventType={eventType}
              premiumPrice={event.price_premium}
              normalPrice={event.price_normal}
              premiumRows={event.premium_rows || []}
            />
          ) : (
            <GeneralTicketBooking
              event={event}
              eventType={eventType}
              premiumPrice={event.price_premium}
              normalPrice={event.price_normal}
            />
          )}
        </div>

        {/* Booking Cart Sidebar */}
        <div>
          <BookingCart event={event} eventType={eventType} />
        </div>
      </div>

      {/* Status Messages */}
      {booking.error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{booking.error}</p>
        </div>
      )}

      {booking.holdingStatus === 'success' && (
        <div className="p-4 bg-green-900 border border-green-700 rounded-lg text-green-200">
          <p className="font-semibold">✓ Items Successfully Held</p>
          <p className="text-sm">Your items are reserved for 5 minutes. Complete checkout now.</p>
        </div>
      )}
    </div>
  )
}
