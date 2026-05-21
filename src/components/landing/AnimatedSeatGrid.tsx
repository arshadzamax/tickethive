import React, { useState, useEffect } from 'react'
import { GRID_ROWS, GRID_COLS } from './landingData.js'

export default function AnimatedSeatGrid() {
    const [seats, setSeats] = useState(() =>
        Array.from({ length: GRID_ROWS * GRID_COLS }, () => {
            const r = Math.random()
            if (r < 0.22) return 'sold'
            if (r < 0.32) return 'locked'
            return 'available'
        })
    )

    useEffect(() => {
        const interval = setInterval(() => {
            setSeats(prev => {
                const next = [...prev]
                const changes = 2 + Math.floor(Math.random() * 3)
                for (let i = 0; i < changes; i++) {
                    const idx = Math.floor(Math.random() * next.length)
                    const cur = next[idx]
                    if (cur === 'available') next[idx] = 'locked'
                    else if (cur === 'locked') next[idx] = Math.random() > 0.35 ? 'sold' : 'available'
                    else if (cur === 'sold' && Math.random() < 0.12) next[idx] = 'available'
                }
                return next
            })
        }, 1400)
        return () => clearInterval(interval)
    }, [])

    const cell = 16, gap = 4
    const width = GRID_COLS * (cell + gap)
    const height = GRID_ROWS * (cell + gap)

    const seatColor = s => s === 'sold' ? '#ef4444' : s === 'locked' ? '#fbbf24' : '#22c55e'

    return (
        <div className="relative select-none">
            {/* Stage indicator */}
            <div className="mx-auto mb-3 w-3/5 h-5 rounded-b-full bg-gradient-to-r from-cyan-500/10 via-cyan-500/25 to-cyan-500/10 flex items-center justify-center">
                <span className="text-[9px] font-bold tracking-[0.25em] text-cyan-400/50 uppercase">Stage</span>
            </div>

            <svg width={width} height={height} className="mx-auto block" viewBox={`0 0 ${width} ${height}`}>
                {seats.map((status, i) => {
                    const row = Math.floor(i / GRID_COLS)
                    const col = i % GRID_COLS
                    return (
                        <circle
                            key={i}
                            cx={col * (cell + gap) + cell / 2}
                            cy={row * (cell + gap) + cell / 2}
                            r={cell / 2 - 1}
                            fill={seatColor(status)}
                            className="seat-grid-circle"
                            opacity={status === 'available' ? 0.65 : 0.9}
                        />
                    )
                })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 mt-4 text-[10px] text-neutral-500">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Reserved</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Sold</div>
            </div>
        </div>
    )
}
