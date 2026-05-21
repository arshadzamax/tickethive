import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/apiClient.js'

export default function BookingSuccessPage() {
  const { groupBookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await api.get(`/group-bookings/${groupBookingId}`)
        setBooking(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }
    if (groupBookingId) fetchBooking()
  }, [groupBookingId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-neutral-400 animate-pulse text-lg">Loading booking details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Link
            to="/events"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition"
          >
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const gb = booking?.groupBooking
  const orders = booking?.orders || []

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="max-w-lg w-full mx-auto">
        {/* Success Card */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center relative overflow-hidden">
            {/* Animated background circles */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Booking Confirmed!</h1>
              <p className="text-emerald-100 text-sm">Your tickets have been reserved successfully</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6 space-y-5">
            {/* Booking ID */}
            <div className="flex items-center justify-between p-3 bg-neutral-800/60 rounded-lg border border-neutral-700/50">
              <span className="text-sm text-neutral-400">Booking ID</span>
              <span className="text-sm font-mono text-neutral-200">{groupBookingId?.slice(0, 8)}...</span>
            </div>

            {/* Event Name */}
            {orders[0]?.event_name && (
              <div className="flex items-center justify-between p-3 bg-neutral-800/60 rounded-lg border border-neutral-700/50">
                <span className="text-sm text-neutral-400">Event</span>
                <span className="text-sm font-semibold text-neutral-200">{orders[0].event_name}</span>
              </div>
            )}

            {/* Items */}
            <div className="p-4 bg-neutral-800/60 rounded-lg border border-neutral-700/50">
              <p className="text-sm text-neutral-400 mb-3">Items Booked</p>
              <div className="space-y-2">
                {orders.map((order, idx) => (
                  <div key={order.id || idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-neutral-300">
                        {order.seat_id 
                          ? `Seat (${order.category || 'Standard'})`
                          : `${order.ticket_count}× ${order.category || 'Standard'} Ticket${order.ticket_count > 1 ? 's' : ''}`
                        }
                      </span>
                    </div>
                    <span className="text-neutral-200 font-medium">₹{Number(order.total_amount || order.price_per_unit).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <span className="text-neutral-300 font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-emerald-400">₹{Number(gb?.total_amount || booking?.totalAmount || 0).toFixed(2)}</span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 p-3 bg-neutral-800/40 rounded-lg">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                gb?.status === 'completed' || gb?.status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {gb?.status === 'completed' || gb?.status === 'paid' ? 'Paid' : 'Pending Payment'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 space-y-3">
            <Link
              to="/events"
              className="block w-full text-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse More Events
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="block w-full text-center px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition border border-neutral-700"
            >
              Back
            </button>
          </div>
        </div>

        {/* Confetti-like decoration */}
        <p className="text-center text-neutral-500 text-xs mt-6">
          🎉 Thank you for your booking! Enjoy the event.
        </p>
      </div>
    </div>
  )
}
