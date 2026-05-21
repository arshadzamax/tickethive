import React from 'react'

const cards = [
    { key: 'total', label: 'Total Seats', color: 'from-blue-500 to-indigo-500', icon: '🎪' },
    { key: 'available', label: 'Available', color: 'from-emerald-500 to-green-500', icon: '✅' },
    { key: 'locked', label: 'Locked', color: 'from-amber-500 to-orange-500', icon: '🔒' },
    { key: 'sold', label: 'Sold', color: 'from-red-500 to-rose-500', icon: '🎫' },
    { key: 'adminLocked', label: 'Admin Reserved', color: 'from-purple-500 to-violet-500', icon: '🛡️' }
]

export default function StatsCards({ stats }) {
    if (!stats) return null

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {cards.map(card => (
                <div
                    key={card.key}
                    className="relative overflow-hidden rounded-xl bg-neutral-800/60 border border-neutral-700/50 p-4 backdrop-blur-sm"
                >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`} />
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{card.icon}</span>
                        <div>
                            <div className="text-2xl font-bold text-neutral-100">{stats[card.key] ?? 0}</div>
                            <div className="text-xs text-neutral-400 mt-0.5">{card.label}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
