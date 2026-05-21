import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectUser, selectIsAdmin } from '../features/auth/authSlice.js'
import { updateEvent, cancelEvent, deleteEvent } from '../features/events/eventSlice.js'
import api from '../services/apiClient.js'
import { useState, useEffect } from 'react'

function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', ...opts
  })
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getInitials(email) {
  if (!email) return '?'
  const parts = email.split('@')[0]
  return parts.slice(0, 2).toUpperCase()
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider ${styles[status] || styles.pending}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status || 'pending'}
    </span>
  )
}

function StatCard({ icon, label, value, accent = 'emerald' }) {
  const accentMap = {
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
    rose: 'from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  }
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${accentMap[accent]} border p-4 transition hover:scale-[1.02]`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium truncate" title={label}>{label}</p>
          <p className={`text-xl font-bold mt-0.5 truncate ${accentMap[accent]?.split(' ').pop()}`} title={value}>{value}</p>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition ${
        active
          ? 'bg-neutral-700/80 text-white shadow-lg shadow-neutral-900/50'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700 text-neutral-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

export default function ProfilePage() {
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('bookings')

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile')
      setProfile(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/events" className="text-emerald-400 hover:underline text-sm">Back to Events</Link>
        </div>
      </div>
    )
  }

  const { stats, bookings, orders, hostedEvents } = profile
  const now = new Date()

  // Group orders by group_booking_id for display
  const ordersByBooking = orders.reduce((acc, order) => {
    const key = order.group_booking_id || order.id
    if (!acc[key]) acc[key] = []
    acc[key].push(order)
    return acc
  }, {})

  // Upcoming events (events with future dates that user has booked)
  const upcomingBookings = bookings.filter(b => new Date(b.event_date) >= now)
  const pastBookings = bookings.filter(b => new Date(b.event_date) < now)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/10 to-violet-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_70%)]" />
        
        <div className="relative p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border border-neutral-700/50 rounded-2xl backdrop-blur-sm">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-emerald-500/20">
              {getInitials(user?.email)}
            </div>
            {isAdmin && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg">
                <span className="text-xs">⭐</span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white truncate">{user?.email?.split('@')[0]}</h1>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/25">
                  Admin
                </span>
              )}
            </div>
            <p className="text-neutral-400 text-sm truncate">{user?.email}</p>
            <p className="text-neutral-500 text-xs mt-1">
              Member since {formatDate(profile?.user?.memberSince || user?.created_at)}
            </p>
          </div>

          {/* Quick Action */}
          <Link
            to="/events"
            className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition transform hover:scale-105 shadow-lg shadow-emerald-500/20"
          >
            Browse Events
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon="🎫" label="Total Bookings" value={stats.totalBookings} accent="emerald" />
        <StatCard icon="💰" label="Total Spent" value={formatCurrency(stats.totalSpent)} accent="violet" />
        <StatCard icon="🎪" label="Events Booked" value={stats.uniqueEvents} accent="blue" />
        <StatCard icon="✅" label="Attended" value={stats.eventsAttended} accent="cyan" />
        <StatCard icon="🎤" label="Events Hosted" value={stats.eventsHosted} accent="amber" />
        <StatCard icon="📋" label="Total Orders" value={stats.totalOrders} accent="rose" />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 p-1 bg-neutral-800/50 rounded-xl border border-neutral-700/50 w-fit">
          <TabButton active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} count={bookings.length}>
            My Bookings
          </TabButton>
          <TabButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} count={upcomingBookings.length}>
            Upcoming
          </TabButton>
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} count={pastBookings.length}>
            Past Events
          </TabButton>
          <TabButton active={activeTab === 'hosted'} onClick={() => setActiveTab('hosted')} count={hostedEvents.length}>
            Hosted Events
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <EmptyState
                  icon="🎫"
                  title="No bookings yet"
                  description="Book your first event to see it here!"
                  action={{ label: 'Browse Events', to: '/events' }}
                />
              ) : (
                bookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    orders={ordersByBooking[booking.id] || []}
                  />
                ))
              )}
            </div>
          )}

          {/* Upcoming Tab */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="No upcoming events"
                  description="Book an upcoming event and it will appear here."
                  action={{ label: 'Find Events', to: '/events' }}
                />
              ) : (
                upcomingBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    orders={ordersByBooking[booking.id] || []}
                    showCountdown
                  />
                ))
              )}
            </div>
          )}

          {/* Past Events Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {pastBookings.length === 0 ? (
                <EmptyState
                  icon="📜"
                  title="No past events"
                  description="Your attended events will appear here."
                />
              ) : (
                pastBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    orders={ordersByBooking[booking.id] || []}
                    isPast
                  />
                ))
              )}
            </div>
          )}

          {/* Hosted Events Tab */}
          {activeTab === 'hosted' && (
            <div className="space-y-4">
              {hostedEvents.length === 0 ? (
                <EmptyState
                  icon="🎤"
                  title="No hosted events"
                  description="Create your first event and start selling tickets!"
                  action={{ label: 'Host an Event', to: '/events/create' }}
                />
              ) : (
                hostedEvents.map(event => (
                  <HostedEventCard key={event.id} event={event} refreshProfile={fetchProfile} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============ Sub-components ============ */

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4 opacity-50">{icon}</span>
      <h3 className="text-lg font-semibold text-neutral-300 mb-1">{title}</h3>
      <p className="text-neutral-500 text-sm mb-6 max-w-xs">{description}</p>
      {action && (
        <Link
          to={action.to}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}

function BookingCard({ booking, orders, showCountdown, isPast }) {
  const [expanded, setExpanded] = useState(false)

  const daysUntil = showCountdown
    ? Math.ceil((new Date(booking.event_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className={`rounded-xl border transition overflow-hidden ${
      isPast
        ? 'bg-neutral-800/30 border-neutral-700/30'
        : 'bg-neutral-800/60 border-neutral-700/50 hover:border-neutral-600/60'
    }`}>
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
              booking.event_type === 'SEATED'
                ? 'bg-blue-500/15 border border-blue-500/25'
                : 'bg-violet-500/15 border border-violet-500/25'
            }`}>
              {booking.event_type === 'SEATED' ? '💺' : '🎟️'}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-neutral-100 truncate">{booking.event_name}</h3>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                <span>📅 {formatDate(booking.event_date)}</span>
                <span className="capitalize">• {booking.event_type?.toLowerCase()}</span>
                {booking.organiser && <span>• {booking.organiser}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showCountdown && daysUntil !== null && (
              <div className="text-right">
                <p className="text-xs text-neutral-500">Starts in</p>
                <p className="text-sm font-bold text-emerald-400">
                  {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                </p>
              </div>
            )}
            <div className="text-right">
              <p className="text-lg font-bold text-white">{formatCurrency(booking.total_amount)}</p>
              <StatusBadge status={booking.status} />
            </div>
            <svg
              className={`w-4 h-4 text-neutral-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-neutral-700/40 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Order Details</p>
            <p className="text-[10px] text-neutral-600 font-mono">ID: {booking.id.slice(0, 8)}</p>
          </div>
          
          {orders.length > 0 ? (
            <div className="space-y-2">
              {orders.map((order, idx) => (
                <div key={order.id || idx} className="flex items-center justify-between p-3 bg-neutral-900/60 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-neutral-300">
                      {order.seat_id
                        ? `Row ${order.seat_row}, Seat ${order.seat_number}`
                        : `${order.ticket_count}× Ticket`
                      }
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      order.category === 'PREMIUM'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-neutral-700 text-neutral-400'
                    }`}>
                      {order.category || 'Standard'}
                    </span>
                  </div>
                  <span className="text-neutral-200 font-medium">{formatCurrency(order.total_amount || order.price_per_unit)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No item details available</p>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-700/30">
            <span className="text-xs text-neutral-500">Booked on {formatDate(booking.created_at, { hour: '2-digit', minute: '2-digit' })}</span>
            {!isPast && (
              <Link
                to={`/events/${booking.event_id}/booking`}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
              >
                View Event →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function HostedEventCard({ event, refreshProfile }) {
  const dispatch = useDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const [showAddons, setShowAddons] = useState(false)
  const [showPromos, setShowPromos] = useState(false)
  const isPast = new Date(event.date) < new Date()
  const isCancelled = event.status === 'cancelled'

  // --- Add-on management state ---
  const [addons, setAddons] = useState([])
  const [addonsLoading, setAddonsLoading] = useState(false)
  const [addonForm, setAddonForm] = useState({ name: '', description: '', price: '', maxQuantity: '' })
  const [addonSaving, setAddonSaving] = useState(false)

  // --- Promo code management state ---
  const [promos, setPromos] = useState([])
  const [promosLoading, setPromosLoading] = useState(false)
  const [promoForm, setPromoForm] = useState({ code: '', discountType: 'pct', discountValue: '', maxUses: '', expiresAt: '' })
  const [promoSaving, setPromoSaving] = useState(false)

  const fetchAddons = async () => {
    setAddonsLoading(true)
    try { const r = await api.get(`/events/${event.id}/addons`); setAddons(r.data) } catch {}
    setAddonsLoading(false)
  }

  const fetchPromos = async () => {
    setPromosLoading(true)
    try { const r = await api.get(`/events/${event.id}/promo-codes`); setPromos(r.data) } catch {}
    setPromosLoading(false)
  }

  const handleToggleAddons = () => {
    if (!showAddons) fetchAddons()
    setShowAddons(v => !v)
  }

  const handleTogglePromos = () => {
    if (!showPromos) fetchPromos()
    setShowPromos(v => !v)
  }

  const handleCreateAddon = async () => {
    if (!addonForm.name.trim() || addonForm.price === '') return
    setAddonSaving(true)
    try {
      await api.post(`/events/${event.id}/addons`, {
        name: addonForm.name.trim(),
        description: addonForm.description.trim() || null,
        price: Number(addonForm.price),
        maxQuantity: addonForm.maxQuantity ? Number(addonForm.maxQuantity) : null,
      })
      setAddonForm({ name: '', description: '', price: '', maxQuantity: '' })
      fetchAddons()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create add-on')
    }
    setAddonSaving(false)
  }

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm('Delete this add-on?')) return
    try { await api.delete(`/events/${event.id}/addons/${addonId}`); fetchAddons() } catch {}
  }

  const handleCreatePromo = async () => {
    if (!promoForm.code.trim() || !promoForm.discountValue) return
    setPromoSaving(true)
    try {
      await api.post(`/events/${event.id}/promo-codes`, {
        code: promoForm.code.trim(),
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : null,
        expiresAt: promoForm.expiresAt || null,
      })
      setPromoForm({ code: '', discountType: 'pct', discountValue: '', maxUses: '', expiresAt: '' })
      fetchPromos()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create promo code')
    }
    setPromoSaving(false)
  }

  const handleDeletePromo = async (codeId) => {
    if (!window.confirm('Delete this promo code?')) return
    try { await api.delete(`/events/${event.id}/promo-codes/${codeId}`); fetchPromos() } catch {}
  }

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this event? This will stop further bookings.')) {
      try {
        await dispatch(cancelEvent(event.id)).unwrap()
        refreshProfile()
      } catch (err) {
        const msg = err?.message || err?.data?.message || 'Failed to cancel event'
        alert(msg)
      }
    }
  }

  const handleDelete = async () => {
    if (window.confirm('WARNING: This will permanently delete the event and all associated bookings. Are you completely sure?')) {
      try {
        await dispatch(deleteEvent(event.id)).unwrap()
        refreshProfile()
      } catch (err) {
        const msg = err?.message || err?.data?.message || 'Failed to delete event'
        alert(msg)
      }
    }
  }

  const INPUT_SM = 'w-full px-3 py-2 text-sm rounded-lg bg-neutral-800/60 border border-neutral-600/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition'

  return (
    <div className={`rounded-xl border transition ${
      isPast ? 'bg-neutral-800/30 border-neutral-700/30' : 'bg-neutral-800/60 border-neutral-700/50 hover:border-emerald-500/30'
    }`}>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg border ${
              isPast ? 'bg-neutral-700/30 border-neutral-600/30' : 'bg-emerald-500/10 border-emerald-500/25'
            }`}>
              {event.event_type === 'SEATED' ? '🏟️' : '🎪'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-100 truncate">{event.name}</h3>
                {isCancelled && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25">
                    Cancelled
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                <span>📅 {formatDate(event.date)}</span>
                <span className="capitalize">• {event.event_type?.toLowerCase()}</span>
                {event.total_capacity && <span>• {event.total_capacity} capacity</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 mt-4 sm:mt-0">
            <div className="text-right text-sm sm:mr-2">
              <p className="text-neutral-400">Normal: <span className="text-white font-medium">{formatCurrency(event.price_normal)}</span></p>
              <p className="text-neutral-400">Premium: <span className="text-amber-400 font-medium">{formatCurrency(event.price_premium)}</span></p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPast ? (
                <span className="px-3 py-1 rounded-lg bg-neutral-700/50 text-neutral-500 text-xs font-medium">Ended</span>
              ) : isCancelled ? (
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/20">
                  Delete
                </button>
              ) : (
                <>
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-200 text-xs font-semibold rounded-lg transition border border-neutral-600/50">
                    Edit
                  </button>
                  <button onClick={handleCancel} className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold rounded-lg transition border border-amber-500/20">
                    Cancel
                  </button>
                  <Link to={`/events/${event.id}/booking`} className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg transition border border-emerald-500/20">
                    Manage
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Monetization tools row */}
        {!isPast && (
          <div className="mt-4 pt-4 border-t border-neutral-700/40 flex flex-wrap gap-2">
            <button
              onClick={handleToggleAddons}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                showAddons ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-neutral-700/40 text-neutral-400 hover:text-neutral-200 border-neutral-600/40'
              }`}
            >
              ✨ Add-ons {addons.length > 0 && `(${addons.length})`}
            </button>
            <button
              onClick={handleTogglePromos}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                showPromos ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-neutral-700/40 text-neutral-400 hover:text-neutral-200 border-neutral-600/40'
              }`}
            >
              🏷 Promo Codes {promos.length > 0 && `(${promos.length})`}
            </button>
          </div>
        )}
      </div>

      {/* Add-ons Panel */}
      {showAddons && (
        <div className="mx-5 mb-5 rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-violet-500/15 flex items-center gap-2">
            <span className="text-sm font-semibold text-violet-300">✨ Manage Add-ons</span>
            {addonsLoading && <span className="text-xs text-neutral-500 ml-auto animate-pulse">Loading…</span>}
          </div>
          <div className="p-4 space-y-3">
            {/* Existing addons */}
            {addons.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/40 text-sm">
                <div>
                  <p className="text-neutral-200 font-medium">{a.name}</p>
                  {a.description && <p className="text-xs text-neutral-400 mt-0.5">{a.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-violet-400 font-bold">{formatCurrency(a.price)}</p>
                  {a.max_quantity && <p className="text-xs text-neutral-500">Max: {a.max_quantity}</p>}
                </div>
                <button onClick={() => handleDeleteAddon(a.id)} className="text-neutral-500 hover:text-red-400 transition text-xs ml-1">✕</button>
              </div>
            ))}

            {/* Create new add-on */}
            <div className="pt-2 border-t border-violet-500/15 grid grid-cols-2 gap-2">
              <input value={addonForm.name} onChange={e => setAddonForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Add-on name *" className={`${INPUT_SM} col-span-2`} />
              <input value={addonForm.description} onChange={e => setAddonForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)" className={`${INPUT_SM} col-span-2`} />
              <input type="number" value={addonForm.price} onChange={e => setAddonForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Price (₹) *" className={INPUT_SM} min={0} />
              <input type="number" value={addonForm.maxQuantity} onChange={e => setAddonForm(f => ({ ...f, maxQuantity: e.target.value }))}
                placeholder="Max qty (optional)" className={INPUT_SM} min={1} />
              <button onClick={handleCreateAddon} disabled={addonSaving || !addonForm.name || addonForm.price === ''}
                className="col-span-2 py-2 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-semibold border border-violet-500/25 disabled:opacity-40 transition">
                {addonSaving ? 'Saving…' : '+ Add Add-on'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Codes Panel */}
      {showPromos && (
        <div className="mx-5 mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-500/15 flex items-center gap-2">
            <span className="text-sm font-semibold text-emerald-300">🏷 Manage Promo Codes</span>
            {promosLoading && <span className="text-xs text-neutral-500 ml-auto animate-pulse">Loading…</span>}
          </div>
          <div className="p-4 space-y-3">
            {/* Existing promos */}
            {promos.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/40 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-emerald-400 text-xs tracking-wider">{p.code}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {p.discount_type === 'pct' ? `${p.discount_value}% off` : `₹${p.discount_value} off`}
                    {p.max_uses && ` • ${p.uses_count}/${p.max_uses} used`}
                    {!p.max_uses && ` • ${p.uses_count} used`}
                    {p.expires_at && ` • Expires ${formatDate(p.expires_at)}`}
                  </p>
                </div>
                <button onClick={() => handleDeletePromo(p.id)} className="text-neutral-500 hover:text-red-400 transition text-xs shrink-0">✕</button>
              </div>
            ))}

            {/* Create new promo */}
            <div className="pt-2 border-t border-emerald-500/15 grid grid-cols-2 gap-2">
              <input value={promoForm.code} onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Code (e.g. SUMMER20) *" className={`${INPUT_SM} col-span-2 uppercase`} />
              <select value={promoForm.discountType} onChange={e => setPromoForm(f => ({ ...f, discountType: e.target.value }))}
                className={INPUT_SM}>
                <option value="pct">% Discount</option>
                <option value="fixed">Fixed (₹) Discount</option>
              </select>
              <input type="number" value={promoForm.discountValue} onChange={e => setPromoForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={promoForm.discountType === 'pct' ? 'e.g. 20 (%)' : 'e.g. 500 (₹)'} className={INPUT_SM} min={0} />
              <input type="number" value={promoForm.maxUses} onChange={e => setPromoForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Max uses (optional)" className={INPUT_SM} min={1} />
              <input type="date" value={promoForm.expiresAt} onChange={e => setPromoForm(f => ({ ...f, expiresAt: e.target.value }))}
                className={INPUT_SM} />
              <button onClick={handleCreatePromo} disabled={promoSaving || !promoForm.code || !promoForm.discountValue}
                className="col-span-2 py-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold border border-emerald-500/25 disabled:opacity-40 transition">
                {promoSaving ? 'Saving…' : '+ Create Promo Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <EditEventModal
          event={event}
          onClose={() => setIsEditing(false)}
          onSuccess={() => { setIsEditing(false); refreshProfile() }}
        />
      )}
    </div>
  )
}


function EditEventModal({ event, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    name: event.name,
    date: new Date(event.date).toISOString().slice(0, 16),
    priceNormal: event.price_normal,
    pricePremium: event.price_premium
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Create Date object assuming local time (what datetime-local provides)
    // and convert to full ISO string for the backend
    const dt = new Date(form.date)
    
    try {
      await dispatch(updateEvent({
        eventId: event.id,
        formData: {
          ...form,
          date: dt.toISOString()
        }
      })).unwrap()
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to update event')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit Event</h3>
            <button onClick={onClose} className="text-neutral-500 hover:text-white transition">✕</button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Event Name</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Date & Time</label>
              <input 
                type="datetime-local" 
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Normal Price</label>
                <input 
                  type="number" 
                  min="1"
                  value={form.priceNormal} 
                  onChange={e => setForm({...form, priceNormal: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Premium Price</label>
                <input 
                  type="number" 
                  min="1"
                  value={form.pricePremium} 
                  onChange={e => setForm({...form, pricePremium: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
