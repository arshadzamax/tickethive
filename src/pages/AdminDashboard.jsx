import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSeats } from '../features/seats/seatSlice.js'
import { selectLiveStats } from '../features/seats/seatSelectors.js'
import {
    fetchStats,
    resetSeats,
    selectAdminStats,
    selectAdminLoading,
    selectAdminActionLoading,
    selectAdminError,
    selectAdminActionMessage,
    clearActionMessage,
    clearAdminError
} from '../features/admin/adminSlice.js'
import StatsCards from '../features/admin/StatsCards.jsx'
import GridControls from '../features/admin/GridControls.jsx'
import AdminSeatMap from '../features/admin/AdminSeatMap.jsx'

export default function AdminDashboard() {
    const dispatch = useDispatch()
    const adminStats = useSelector(selectAdminStats)
    const liveStats = useSelector(selectLiveStats)
    const loading = useSelector(selectAdminLoading)
    const actionLoading = useSelector(selectAdminActionLoading)
    const error = useSelector(selectAdminError)
    const actionMessage = useSelector(selectAdminActionMessage)
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    useEffect(() => {
        dispatch(fetchStats())
        dispatch(fetchSeats())
    }, [dispatch])

    useEffect(() => {
        if (actionMessage) {
            const ev = new CustomEvent('th_toast', { detail: { message: actionMessage } })
            window.dispatchEvent(ev)
            dispatch(clearActionMessage())
            // Refresh data after action
            dispatch(fetchStats())
            dispatch(fetchSeats())
        }
    }, [actionMessage, dispatch])

    useEffect(() => {
        if (error) {
            const ev = new CustomEvent('th_toast', { detail: { message: `Error: ${error}` } })
            window.dispatchEvent(ev)
            dispatch(clearAdminError())
        }
    }, [error, dispatch])

    const handleReset = useCallback(() => {
        dispatch(resetSeats())
        setShowResetConfirm(false)
    }, [dispatch])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-100">Admin Dashboard</h1>
                    <p className="text-sm text-neutral-400 mt-1">Manage seats, locks, and grid dimensions</p>
                </div>
                <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-medium hover:from-red-400 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
                >
                    Reset All Seats
                </button>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-neutral-100 mb-2">Confirm Reset</h3>
                        <p className="text-sm text-neutral-400 mb-6">
                            This will set <span className="text-red-400 font-medium">all seats to available</span>, remove all admin locks, and <span className="text-red-400 font-medium">delete all orders</span>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm hover:bg-neutral-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-400 disabled:opacity-50 transition"
                            >
                                {actionLoading ? 'Resetting…' : 'Yes, Reset All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className="text-sm text-neutral-400 animate-pulse">Loading statistics…</div>}

            <StatsCards stats={liveStats} />
            <GridControls stats={adminStats} />
            <AdminSeatMap />
        </div>
    )
}
