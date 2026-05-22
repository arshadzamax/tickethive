import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setTicketSelection, clearTicketSelection } from '../../features/booking/bookingSlice'
import type { GeneralTicketBookingProps } from '../../types'
import type { RootState } from '../../app/store'

export default function GeneralTicketBooking({ event, eventType, premiumPrice, normalPrice }: GeneralTicketBookingProps) {
  const dispatch = useDispatch()
  const selectedItems = useSelector((state: RootState) => state.booking.selectedItems)
  const [normalQty, setNormalQty] = useState<number>(0)
  const [premiumQty, setPremiumQty] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<'NORMAL' | 'PREMIUM'>('NORMAL')

  // Update Redux when quantities change
  useEffect(() => {
    const activeQty = selectedCategory === 'NORMAL' ? normalQty : premiumQty
    if (activeQty > 0) {
      dispatch(setTicketSelection({ quantity: activeQty, category: selectedCategory }))
    } else {
      dispatch(clearTicketSelection())
    }
  }, [normalQty, premiumQty, selectedCategory, dispatch])

  const totalPrice = selectedCategory === 'NORMAL' ? normalQty * normalPrice : premiumQty * premiumPrice

  const handleIncrement = () => {
    if (selectedCategory === 'NORMAL') {
      setNormalQty(prev => Math.min(prev + 1, 20))
    } else {
      setPremiumQty(prev => Math.min(prev + 1, 20))
    }
  }

  const handleDecrement = () => {
    if (selectedCategory === 'NORMAL') {
      setNormalQty(prev => Math.max(prev - 1, 0))
    } else {
      setPremiumQty(prev => Math.max(prev - 1, 0))
    }
  }

  const handleClear = () => {
    setNormalQty(0)
    setPremiumQty(0)
    dispatch(clearTicketSelection())
  }

  const switchCategory = (category: 'NORMAL' | 'PREMIUM'): void => {
    setSelectedCategory(category)
  }

  return (
    <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg border border-slate-700">
      <h3 className="text-2xl font-bold text-white mb-6">Get Your Tickets</h3>

      {/* Event Info */}
      <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h4 className="text-lg font-semibold text-white mb-2">{event?.name}</h4>
        <p className="text-slate-400 text-sm">
          {event?.date ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
        </p>
      </div>

      {/* Ticket Type Selection */}
      <div className="mb-8 space-y-4">
        {/* NORMAL Tickets */}
        <div
          onClick={() => switchCategory('NORMAL')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition ${
            selectedCategory === 'NORMAL'
              ? 'bg-blue-900 border-blue-500 ring-2 ring-blue-400'
              : 'bg-slate-800 border-slate-600 hover:border-slate-500'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-lg font-bold text-white">Standard Tickets</h4>
              <p className="text-slate-400 text-sm">General admission, open seating area</p>
            </div>
            <span className="text-2xl font-bold text-green-400">₹{normalPrice}</span>
          </div>
          {selectedCategory === 'NORMAL' && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDecrement()
                }}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
              >
                −
              </button>
              <span className="text-white font-bold text-lg">{normalQty} Ticket{normalQty !== 1 ? 's' : ''}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleIncrement()
                }}
                className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* PREMIUM Tickets */}
        <div
          onClick={() => switchCategory('PREMIUM')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition ${
            selectedCategory === 'PREMIUM'
              ? 'bg-blue-900 border-blue-500 ring-2 ring-blue-400'
              : 'bg-slate-800 border-slate-600 hover:border-slate-500'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-lg font-bold text-white">Premium Tickets</h4>
              <p className="text-slate-400 text-sm">VIP access, premium seating area</p>
            </div>
            <span className="text-2xl font-bold text-yellow-400">₹{premiumPrice}</span>
          </div>
          {selectedCategory === 'PREMIUM' && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDecrement()
                }}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
              >
                −
              </button>
              <span className="text-white font-bold text-lg">{premiumQty} Ticket{premiumQty !== 1 ? 's' : ''}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleIncrement()
                }}
                className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-lg border border-slate-600 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-slate-300 mb-2">
              <span className="capitalize">{selectedCategory.toLowerCase()} Tickets: </span>
              <span className="font-bold text-white text-lg">
                {selectedCategory === 'NORMAL' ? normalQty : premiumQty}
              </span>
            </p>
            <p className="text-slate-300">
              Total Price: <span className="font-bold text-xl text-green-400">₹{totalPrice}</span>
            </p>
          </div>
          <button
            onClick={handleClear}
            disabled={normalQty === 0 && premiumQty === 0}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition"
          >
            Clear
          </button>
        </div>

        {(normalQty > 0 || premiumQty > 0) && (
          <div className="mt-4 p-3 bg-slate-900 rounded text-slate-300 text-sm border border-slate-700">
            <p className="font-semibold text-white mb-2">Order Summary:</p>
            {normalQty > 0 && (
              <p>Standard: {normalQty} ticket{normalQty !== 1 ? 's' : ''} × ₹{normalPrice} = ₹{normalQty * normalPrice}</p>
            )}
            {premiumQty > 0 && (
              <p>Premium: {premiumQty} ticket{premiumQty !== 1 ? 's' : ''} × ₹{premiumPrice} = ₹{premiumQty * premiumPrice}</p>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-slate-800 rounded-lg border-l-4 border-blue-500 text-slate-300 text-sm">
        <p className="font-semibold text-white mb-2">ℹ️ Group Booking</p>
        <p>You can book up to 20 tickets at once. All tickets for friends and family will be grouped together.</p>
      </div>
    </div>
  )
}
