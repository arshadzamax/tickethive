import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSeats } from './seatSlice.js'
import { makeSelectSeatIds, selectAllSeats, selectLoading } from './seatSelectors.js'
import SeatItem from './SeatItem.jsx'

export default function SeatMap() {
  const dispatch = useDispatch()
  const selectIds = useMemo(() => makeSelectSeatIds(), [])
  const seatIds = useSelector(selectIds)
  const seats = useSelector(selectAllSeats)
  const loading = useSelector(selectLoading)

  useEffect(() => {
    dispatch(fetchSeats())
  }, [dispatch])

  const dims = useMemo(() => {
    if (!seats.length) return { width: 800, height: 400 }
    const rows = new Set(seats.map(s => s.row)).size
    const cols = Math.max(...seats.map(s => s.number))
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
          <SeatItem key={id} seatId={id} />
        ))}
      </svg>
      {loading && <div className="mt-2 text-xs text-neutral-400">Loading seats…</div>}
    </div>
  )
}

