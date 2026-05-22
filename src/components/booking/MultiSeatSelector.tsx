import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectSeat, deselectSeat, clearSelectedSeats } from '../../features/booking/bookingSlice'
import { selectAllSeats, selectLoading } from '../../features/seats/seatSelectors'
import type { MultiSeatSelectorProps } from '../../types'
import type { RootState } from '../../app/store'
import type { Seat } from '../../types'

export default function MultiSeatSelector({ eventId, eventType, premiumPrice, normalPrice, premiumRows = [] }: MultiSeatSelectorProps) {
  const dispatch = useDispatch()
  const seats = useSelector((state: RootState) => selectAllSeats(state))
  const seatsLoading = useSelector((state: RootState) => selectLoading(state))
  const selectedItems = useSelector((state: RootState) => state.booking.selectedItems)
  const seatIds = Array.isArray(selectedItems) ? selectedItems : []
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const isSeatSelected = (seatId: string | number): boolean => seatIds.includes(seatId)

  const handleSeatClick = (seatId: string | number, category: string): void => {
    if (isSeatSelected(seatId)) {
      dispatch(deselectSeat(seatId))
    } else {
      dispatch(selectSeat(seatId))
    }
  }

  const handleClearAll = () => {
    dispatch(clearSelectedSeats())
  }

  // Determine seat category based on premium rows config
  const getSeatCategory = (seat?: Seat): string => {
    if (!seat) return 'NORMAL'
    if (seat.category) return seat.category
    if (premiumRows.includes(Number(seat.row))) return 'PREMIUM'
    return 'NORMAL'
  }

  // Calculate total price
  const totalPrice = seatIds.reduce((sum: number, seatId: string | number): number => {
    const seat = seats.find((s: Seat) => s.id === seatId)
    const category = getSeatCategory(seat)
    const price = category === 'PREMIUM' ? Number(premiumPrice) : Number(normalPrice)
    return sum + price
  }, 0)

  // Group seats by row
  const seatsByRow = seats.reduce((acc: Record<string, Seat[]>, seat: Seat): Record<string, Seat[]> => {
    const rowKey = String(seat.row ?? '0')
    if (!acc[rowKey]) acc[rowKey] = []
    acc[rowKey].push(seat)
    return acc
  }, {})

  if (seatsLoading) {
    return (
      <div className="p-6 bg-slate-900 rounded-lg text-center">
        <div className="text-slate-400 animate-pulse">Loading seats...</div>
      </div>
    )
  }

  if (seats.length === 0) {
    return (
      <div className="p-6 bg-slate-900 rounded-lg text-center">
        <div className="text-slate-400">No seats available for this event.</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-900 rounded-lg">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Select Your Seats</h3>

        {/* Category filter */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filterCategory === null ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All ({seats.length})
          </button>
          <button
            onClick={() => setFilterCategory('PREMIUM')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filterCategory === 'PREMIUM' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Premium (₹{premiumPrice})
          </button>
          <button
            onClick={() => setFilterCategory('NORMAL')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filterCategory === 'NORMAL' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Normal (₹{normalPrice})
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-6 text-sm mb-6 text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded border border-emerald-400"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded border border-blue-400"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded border border-red-400"></div>
            <span>Sold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded border border-amber-400"></div>
            <span>Locked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500 rounded border border-yellow-400"></div>
            <span>Premium</span>
          </div>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="bg-slate-800 p-6 rounded-lg mb-6 overflow-x-auto">
        <div className="inline-block min-w-max">
          {/* Stage indicator */}
          <div className="text-center mb-8">
            <div className="inline-block px-12 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded text-white font-bold">
              STAGE
            </div>
          </div>

          {/* Seats */}
          <div className="space-y-2">
            {Object.keys(seatsByRow)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(row => (
                <div key={row} className="flex items-center gap-4">
                  <span className="w-8 text-right text-slate-400 font-bold">Row {row}</span>
                  <div className="flex gap-1">
                    {(seatsByRow[row] ?? [])
                      .sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0))
                      .map(seat => {
                        const isSelected = isSeatSelected(seat.id)
                        const category = getSeatCategory(seat)
                        const isPremium = category === 'PREMIUM'
                        const isSold = seat.status === 'sold'
                        const isLocked = seat.status === 'locked'
                        const isAdminLocked = Boolean(seat.adminLocked || seat['admin_locked'])
                        const isUnavailable = isSold || isLocked || isAdminLocked
                        const showSeat = !filterCategory || category === filterCategory

                        if (!showSeat) return null

                        return (
                          <button
                            key={seat.id}
                            onClick={() => !isUnavailable && handleSeatClick(seat.id, category)}
                            disabled={isUnavailable}
                            className={`w-8 h-8 rounded border-2 font-bold text-xs transition transform ${
                              isSold
                                ? 'bg-red-600 border-red-400 cursor-not-allowed opacity-60'
                                : isAdminLocked
                                  ? 'bg-purple-600 border-purple-400 cursor-not-allowed opacity-60'
                                  : isLocked
                                    ? 'bg-amber-500 border-amber-400 cursor-not-allowed opacity-75'
                                    : isSelected
                                      ? 'bg-blue-600 border-blue-400 scale-110 shadow-lg shadow-blue-500'
                                      : isPremium
                                        ? 'bg-yellow-500 border-yellow-400 hover:scale-105'
                                        : 'bg-emerald-500 border-emerald-400 hover:scale-105 hover:bg-emerald-400'
                            }`}
                            title={`${isPremium ? 'Premium' : 'Normal'} - Row ${seat.row}, Seat ${seat.number}${isSold ? ' (Sold)' : isLocked ? ' (Locked)' : isAdminLocked ? ' (Reserved)' : ''}`}
                          >
                            {seat.number}
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-lg border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-slate-300">Selected Seats: <span className="font-bold text-white">{seatIds.length}</span></p>
            <p className="text-slate-300 text-sm">Total: <span className="font-bold text-lg text-green-400">₹{totalPrice}</span></p>
          </div>
          <button
            onClick={handleClearAll}
            disabled={seatIds.length === 0}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition"
          >
            Clear All
          </button>
        </div>

        {/* Selected seats list */}
        {seatIds.length > 0 && (
          <div className="mt-4 p-3 bg-slate-900 rounded text-slate-300 text-sm">
            <p className="font-semibold text-white mb-2">Your Seats:</p>
            <div className="flex flex-wrap gap-2">
              {seatIds.map((seatId: string | number) => {
                const seat = seats.find(s => s.id === seatId)
                return (
                  <span key={seatId} className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    {seat?.row}-{seat?.number}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
