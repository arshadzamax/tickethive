import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useParams } from 'react-router-dom'
import { selectConnectionStatus } from '../features/seats/seatSelectors.js'
import { selectUser, selectIsAdmin, logout } from '../features/auth/authSlice.js'
import Toast from './Toast.jsx'

export default function Layout({ children }) {
  const status = useSelector(selectConnectionStatus)
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  const dispatch = useDispatch()
  const location = useLocation()
  const { eventId } = useParams()
  const dotClass = status === 'connected' ? 'th-connection-dot connected' : 'th-connection-dot connecting'

  const isActive = (path) => location.pathname === path

  const bookingPath = eventId ? `/events/${eventId}/booking` : '/events'
  const adminPath = eventId ? `/events/${eventId}/admin` : '/events'

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-[#071024] via-transparent to-[#03040a]">
      <header className="th-header border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/events" className="th-brand text-xl hover:opacity-80 transition">TicketHive</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                to="/events"
                className={`transition ${location.pathname === '/events' ? 'text-emerald-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                Events
              </Link>
              {eventId && (
                <Link
                  to={bookingPath}
                  className={`transition ${isActive(bookingPath) ? 'text-emerald-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'}`}
                >
                  Booking
                </Link>
              )}
              {isAdmin && eventId && (
                <Link
                  to={adminPath}
                  className={`transition ${isActive(adminPath) ? 'text-emerald-400 font-medium' : 'text-neutral-400 hover:text-neutral-200'}`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-300">
            {eventId && (
              <div className="flex items-center gap-2">
                <span className={dotClass}></span>
                <span className="capitalize">{status}</span>
              </div>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-neutral-400">{user.email}</span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">
                    Admin
                  </span>
                )}
                <button
                  onClick={() => dispatch(logout())}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-xs"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {eventId && status !== 'connected' && (
        <div className="bg-yellow-500/10 text-yellow-300 text-xs px-4 py-2 text-center">Connection lost. Live updates paused.</div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10 flex items-start justify-center gap-6">
        <div className="w-full th-card th-fade-in">
          {children}
        </div>
      </main>
      <Toast />
    </div>
  )
}
