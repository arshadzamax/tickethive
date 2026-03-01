import React, { useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAllSeats, selectLoading } from '../seats/seatSelectors.js'
import { adminLockSeat, adminUnlockSeat } from './adminSlice.js'

function seatColor(seat) {
    if (seat.admin_locked || seat.adminLocked) return '#a855f7' // purple for admin-locked
    if (seat.status === 'sold') return '#ef4444'
    if (seat.status === 'locked') return '#f59e0b'
    return '#22c55e'
}

function AdminSeatItem({ seat, cell, gap, onToggleLock }) {
    const isAdminLocked = seat.admin_locked || seat.adminLocked
    const row = typeof seat.row === 'number' ? seat.row - 1 : 0
    const col = Number(seat.number) - 1
    const x = 20 + col * (cell + gap)
    const y = 20 + row * (cell + gap)

    return (
        <g
            transform={`translate(${x}, ${y})`}
            onClick={() => onToggleLock(seat)}
            className="cursor-pointer"
        >
            <circle
                r={cell / 2}
                cx={0}
                cy={0}
                fill={seatColor(seat)}
                className="hover:opacity-80 transition-opacity"
            />
            {isAdminLocked && (
                <text x={0} y={4} textAnchor="middle" fontSize={10} fill="white" pointerEvents="none">
                    🔒
                </text>
            )}
        </g>
    )
}

export default function AdminSeatMap() {
    const dispatch = useDispatch()
    const seats = useSelector(selectAllSeats)
    const loading = useSelector(selectLoading)

    const cell = 24
    const gap = 8

    const dims = useMemo(() => {
        if (!seats.length) return { width: 800, height: 400 }
        const rowCount = new Set(seats.map(s => s.row)).size
        const colCount = Math.max(...seats.map(s => s.number))
        return {
            width: 40 + colCount * (cell + gap),
            height: 40 + rowCount * (cell + gap)
        }
    }, [seats])

    const onToggleLock = useCallback((seat) => {
        const isAdminLocked = seat.admin_locked || seat.adminLocked
        if (isAdminLocked) {
            dispatch(adminUnlockSeat(seat.id))
        } else {
            if (seat.status === 'sold') {
                const ev = new CustomEvent('th_toast', { detail: { message: 'Cannot lock a sold seat' } })
                window.dispatchEvent(ev)
                return
            }
            dispatch(adminLockSeat(seat.id))
        }
    }, [dispatch])

    return (
        <div className="rounded-xl bg-neutral-800/60 border border-neutral-700/50 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-200">Seat Map — Click to toggle admin lock</h3>
            </div>
            <svg width={dims.width} height={dims.height} className="block">
                {seats.map(seat => (
                    <AdminSeatItem key={seat.id} seat={seat} cell={cell} gap={gap} onToggleLock={onToggleLock} />
                ))}
            </svg>
            {loading && <div className="mt-2 text-xs text-neutral-400">Loading seats…</div>}
            <div className="flex items-center gap-4 text-xs text-neutral-400 mt-3">
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500"></span> Available</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-amber-500"></span> Locked</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-500"></span> Sold</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-purple-500"></span> Admin Reserved</div>
            </div>
        </div>
    )
}
