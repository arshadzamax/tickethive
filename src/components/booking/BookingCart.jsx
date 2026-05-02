import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { holdBooking, createGroupBooking, releaseBooking } from '../../features/booking/bookingSlice'
import { selectAllSeats } from '../../features/seats/seatSelectors'
import { useNavigate } from 'react-router-dom'

export default function BookingCart({ event, eventType }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const booking = useSelector(state => state.booking)
  const seats = useSelector(selectAllSeats)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Calculate total price for SEATED events from actual seat data
  const calculateSeatedTotal = () => {
    if (eventType !== 'SEATED' || !Array.isArray(booking.selectedItems)) return 0
    return booking.selectedItems.reduce((sum, seatId) => {
      const seat = seats.find(s => s.id === seatId)
      const isPremium = seat?.category === 'PREMIUM' || 
        (event?.premium_rows || []).includes(seat?.row)
      const price = isPremium ? Number(event?.price_premium) : Number(event?.price_normal)
      return sum + (price || 0)
    }, 0)
  }

  const totalPrice = eventType === 'SEATED' 
    ? calculateSeatedTotal() 
    : (booking.totalPrice || 0)

  const handleHoldBooking = async () => {
    setIsSubmitting(true)
    try {
      const bookingItems = eventType === 'SEATED' 
        ? { seats: booking.selectedItems }
        : { quantity: booking.selectedItems.quantity, category: booking.selectedItems.category }

      const result = await dispatch(holdBooking({
        eventId: event.id,
        bookingItems
      })).unwrap()

      console.log('Booking held:', result)
    } catch (err) {
      console.error('Failed to hold booking:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmBooking = async () => {
    setIsSubmitting(true)
    try {
      const bookingItems = eventType === 'SEATED' 
        ? { seats: booking.selectedItems }
        : { quantity: booking.selectedItems.quantity, category: booking.selectedItems.category }

      const result = await dispatch(createGroupBooking({
        eventId: event.id,
        bookingItems,
        groupLockId: booking.groupLockId
      })).unwrap()

      navigate(`/booking-success/${result.groupBookingId}`)
    } catch (err) {
      console.error('Failed to create booking:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasSelection = eventType === 'SEATED' 
    ? Array.isArray(booking.selectedItems) && booking.selectedItems.length > 0
    : booking.selectedItems?.quantity > 0

  if (!hasSelection) {
    return (
      <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 text-center">
        <p className="text-slate-400 text-lg">
          {eventType === 'SEATED' ? 'Select seats to continue' : 'Select tickets to continue'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg border border-blue-600 sticky top-4">
      <h3 className="text-xl font-bold text-white mb-4">Booking Summary</h3>

      {/* Order Details */}
      <div className="space-y-3 mb-6 pb-6 border-b border-blue-700">
        {eventType === 'SEATED' ? (
          <>
            <div className="flex justify-between text-slate-200">
              <span>Selected Seats:</span>
              <span className="font-semibold">{booking.selectedItems.length}</span>
            </div>
            <div className="text-sm text-slate-300">
              <p className="font-semibold mb-2">Seats:</p>
              <div className="flex flex-wrap gap-2">
                {booking.selectedItems.slice(0, 5).map(seatId => {
                  const seat = seats.find(s => s.id === seatId)
                  return (
                    <span key={seatId} className="bg-blue-700 px-2 py-1 rounded text-xs">
                      R{seat?.row}-S{seat?.number}
                    </span>
                  )
                })}
                {booking.selectedItems.length > 5 && (
                  <span className="bg-blue-700 px-2 py-1 rounded text-xs">
                    +{booking.selectedItems.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-slate-200">
              <span>Tickets:</span>
              <span className="font-semibold">{booking.selectedItems?.quantity}</span>
            </div>
            <div className="flex justify-between text-slate-200">
              <span>Type:</span>
              <span className="font-semibold capitalize">{booking.selectedItems?.category?.toLowerCase()}</span>
            </div>
            <div className="flex justify-between text-slate-200 text-sm">
              <span>Unit Price:</span>
              <span>₹{booking.selectedItems?.quantity ? (totalPrice / booking.selectedItems.quantity) : 0}</span>
            </div>
          </>
        )}

        <div className="flex justify-between text-slate-200 text-sm">
          <span>Event:</span>
          <span className="font-semibold">{event?.name}</span>
        </div>
      </div>

      {/* Total Price */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-white font-semibold text-lg">Total Amount:</span>
        <span className="text-3xl font-bold text-green-400">₹{totalPrice}</span>
      </div>

      {/* Lock Status */}
      {booking.groupLockId && (
        <div className="mb-4 p-3 bg-green-900 border border-green-600 rounded text-green-200 text-sm">
          ✓ Items locked for 5 minutes
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!booking.groupLockId ? (
          <button
            onClick={handleHoldBooking}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition transform hover:scale-105 active:scale-95"
          >
            {isSubmitting ? 'Holding...' : 'Hold Items (5 min)'}
          </button>
        ) : (
          <>
            <button
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition transform hover:scale-105 active:scale-95"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Booking'}
            </button>

            <button
              onClick={() => dispatch(releaseBooking({
                eventId: event.id,
                groupLockId: booking.groupLockId,
                bookingItems: eventType === 'SEATED'
                  ? { seats: booking.selectedItems }
                  : { quantity: booking.selectedItems.quantity, category: booking.selectedItems.category }
              }))}
              disabled={isSubmitting}
              className="w-full px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium rounded-lg transition"
            >
              Release & Change
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-slate-400 mt-4 text-center">
        {booking.groupLockId 
          ? '⏰ Your items are held. Complete checkout within 5 minutes.'
          : '📍 Lock items first to complete your group booking.'}
      </p>
    </div>
  )
}
