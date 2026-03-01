import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { resizeGrid, selectAdminActionLoading } from './adminSlice.js'

export default function GridControls({ stats }) {
    const dispatch = useDispatch()
    const actionLoading = useSelector(selectAdminActionLoading)
    const [rows, setRows] = useState(stats?.rows || 5)
    const [cols, setCols] = useState(stats?.cols || 10)

    const onResize = () => {
        if (rows >= 1 && cols >= 1 && rows <= 50 && cols <= 50) {
            dispatch(resizeGrid({ rows: Number(rows), cols: Number(cols) }))
        }
    }

    return (
        <div className="rounded-xl bg-neutral-800/60 border border-neutral-700/50 p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-neutral-200 mb-4">Grid Dimensions</h3>
            <div className="flex items-end gap-4">
                <div>
                    <label htmlFor="grid-rows" className="block text-xs text-neutral-400 mb-1">Rows</label>
                    <input
                        id="grid-rows"
                        type="number"
                        min={1}
                        max={50}
                        value={rows}
                        onChange={e => setRows(e.target.value)}
                        className="w-20 px-3 py-2 rounded-lg bg-neutral-900/60 border border-neutral-600/50 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <div className="text-neutral-500 pb-2">×</div>
                <div>
                    <label htmlFor="grid-cols" className="block text-xs text-neutral-400 mb-1">Columns</label>
                    <input
                        id="grid-cols"
                        type="number"
                        min={1}
                        max={50}
                        value={cols}
                        onChange={e => setCols(e.target.value)}
                        className="w-20 px-3 py-2 rounded-lg bg-neutral-900/60 border border-neutral-600/50 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <button
                    onClick={onResize}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                >
                    {actionLoading ? 'Resizing…' : 'Resize Grid'}
                </button>
            </div>
            {stats && (
                <div className="mt-3 text-xs text-neutral-500">
                    Current: {stats.rows} × {stats.cols} ({stats.total} seats)
                </div>
            )}
        </div>
    )
}
