import React from 'react'
import { Link } from 'react-router-dom'

export default function LandingFooter() {
    return (
        <footer className="relative z-10 border-t border-white/5">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="th-brand text-lg">TicketHive</div>
                        <p className="text-xs text-neutral-500 mt-1">
                            The modern platform for live event seat booking.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-500">
                        <Link to="/events" className="hover:text-neutral-300 transition-colors">Events</Link>
                        <Link to="/events/create" className="hover:text-neutral-300 transition-colors">Host an Event</Link>
                        <a href="#features" className="hover:text-neutral-300 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-neutral-300 transition-colors">How It Works</a>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-neutral-600">
                        © {new Date().getFullYear()} TicketHive. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
