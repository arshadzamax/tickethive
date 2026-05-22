import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSeats } from './seatSlice'
import { makeSelectSeatIds, selectAllSeats, selectLoading } from './seatSelectors'
import SeatItem from './SeatItem.tsx'
import type { Seat } from '../../types'
import type { RootState } from '../../app/store'

export default function SeatMap({ eventId }: { eventId?: string | number }) {
  const dispatch = useDispatch()
  const selectIds = useMemo(() => makeSelectSeatIds(), [])
  const seatIds = useSelector((state: RootState) => selectIds(state))
  const seats = useSelector((state: RootState) => selectAllSeats(state))
  const loading = useSelector((state: RootState) => selectLoading(state))

  useEffect(() => {
    if (eventId) dispatch(fetchSeats(eventId))
  }, [dispatch, eventId])

  const dims = useMemo(() => {
    if (!seats.length) return { width: 800, height: 400 }
    const rows = new Set(seats.map(s => Number(s.row ?? 0))).size
    const cols = Math.max(0, ...seats.map(s => Number(s.number ?? 0)))
    const cell = 24
    const gap = 8
    const width = 40 + cols * (cell + gap)
    const height = 40 + rows * (cell + gap)
    return { width, height }
  }, [seats])

  return (
    <div className="rounded-lg bg-neutral-800 p-4 shadow-md">
      <div className="text-sm mb-2 text-neutral-300">Stadium</div>
      <svg width={dims.width} height={dims.height} className="block">
        {seatIds.map(id => (
          <SeatItem key={id} seatId={id} eventId={eventId} />
        ))}
      </svg>
      {loading && <div className="mt-2 text-xs text-neutral-400">Loading seats…</div>}
    </div>
  )
}

