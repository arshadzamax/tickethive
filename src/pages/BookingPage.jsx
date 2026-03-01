import React from 'react'
import SeatMap from '../features/seats/SeatMap.jsx'
import BookingPanel from '../features/booking/BookingPanel.jsx'

export default function BookingPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start justify-center">
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-4">
          <SeatMap />
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500"></span> Available</div>
            <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-amber-500"></span> Locked</div>
            <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-500"></span> Sold</div>
            <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-purple-500"></span> Admin Reserved</div>
          </div>
        </div>
      </div>
      <BookingPanel />
    </div>
  )
}
