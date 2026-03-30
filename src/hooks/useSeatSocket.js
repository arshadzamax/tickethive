import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { applySeatLocked, applySeatReleased, applySeatSold, setConnectionStatus, fetchSeats } from '../features/seats/seatSlice.js'
import { connectSocket, onSeatLocked, onSeatReleased, onSeatSold, onSeatsReset, onSeatAdminLocked, onGridResized, onConnection } from '../services/socketClient.js'
import { normalizeSeat } from '../utils/seatHelpers.js'

export function useSeatSocketInit(eventId) {
  const dispatch = useDispatch()
  useEffect(() => {
    const s = connectSocket()
    onConnection(status => dispatch(setConnectionStatus(status)))
    onSeatLocked(seat => dispatch(applySeatLocked(normalizeSeat(seat))))
    onSeatSold(seat => dispatch(applySeatSold(normalizeSeat(seat))))
    onSeatReleased(seat => dispatch(applySeatReleased(normalizeSeat(seat))))

    // Admin events — re-fetch all seats when admin makes changes
    onSeatsReset(() => { if (eventId) dispatch(fetchSeats(eventId)) })
    onSeatAdminLocked(seat => dispatch(applySeatLocked(normalizeSeat(seat))))
    onGridResized(() => { if (eventId) dispatch(fetchSeats(eventId)) })

    return () => {
      s.off('seat_locked')
      s.off('seat_sold')
      s.off('seat_released')
      s.off('seats_reset')
      s.off('seat_admin_locked')
      s.off('grid_resized')
    }
  }, [dispatch, eventId])
}
