import React, { useMemo } from 'react'
import { tickerItems } from './landingData.js'

export default function BookingTicker() {
    const doubled = useMemo(() => [...tickerItems, ...tickerItems], [])

    return (
        <div className="w-full overflow-hidden bg-white/[0.015] border-y border-white/5 py-3.5">
            <div className="ticker-track">
                {doubled.map((msg, i) => (
                    <span key={i} className="whitespace-nowrap text-sm text-neutral-500 mx-8">
                        {msg}
                    </span>
                ))}
            </div>
        </div>
    )
}
