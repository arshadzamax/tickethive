import React from 'react'

export default function LandingFooter() {
    return (
        <footer className="relative z-10 border-t border-white/5">
            <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="th-brand text-lg">TicketHive</div>
                <p className="text-xs text-neutral-500">
                    © {new Date().getFullYear()} TicketHive — Live Event Seat Booking Engine. Built with React, Redux, Socket.IO & PostgreSQL.
                </p>
            </div>
        </footer>
    )
}
