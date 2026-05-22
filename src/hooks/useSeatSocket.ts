import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { applySeatLocked, applySeatReleased, applySeatSold, setConnectionStatus, fetchSeats } from '../features/seats/seatSlice'
import { connectSocket, joinEvent, leaveEvent, onSeatLocked, onSeatReleased, onSeatSold, onSeatsReset, onSeatAdminLocked, onGridResized, onConnection } from '../services/socketClient'
import { normalizeSeat } from '../utils/seatHelpers'

export function useSeatSocketInit(eventId: string | undefined) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!eventId) return

    const s = connectSocket()

    // If already connected, join immediately; otherwise wait for connect
    if (s.connected) {
      joinEvent(eventId)
    } else {
      s.once('connect', () => joinEvent(eventId))
    }

    onConnection(status => dispatch(setConnectionStatus(status)))
    onSeatLocked(seat => dispatch(applySeatLocked(normalizeSeat(seat))))
    onSeatSold(seat => dispatch(applySeatSold(normalizeSeat(seat))))
    onSeatReleased(seat => dispatch(applySeatReleased(normalizeSeat(seat))))

    // Admin events — re-fetch all seats when admin makes changes
    onSeatsReset(() => dispatch(fetchSeats(eventId)))
    onSeatAdminLocked(seat => dispatch(applySeatLocked(normalizeSeat(seat))))
    onGridResized(() => dispatch(fetchSeats(eventId)))

    return () => {
      leaveEvent(eventId)
      s.off('seat_locked')
      s.off('seat_sold')
      s.off('seat_released')
      s.off('seats_reset')
      s.off('seat_admin_locked')
      s.off('grid_resized')
    }
  }, [dispatch, eventId])
}
