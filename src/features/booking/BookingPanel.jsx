import React, { useCallback } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { selectSelectedSeat } from '../seats/seatSelectors.js'
import { releaseSeat } from '../seats/seatSlice.js'
import { confirmBooking } from './bookingSlice.js'
import CountdownTimer from '../seats/CountdownTimer.jsx'
import { selectEffectiveUserId } from '../../utils/identity.js'

export default function BookingPanel() {
  const dispatch = useDispatch()
  const seat = useSelector(selectSelectedSeat, shallowEqual)
  const effectiveId = useSelector(selectEffectiveUserId)

  const onConfirm = useCallback(() => {
    if (!seat) return
    dispatch(confirmBooking(seat.id))
  }, [dispatch, seat])

  const onExpire = useCallback(() => {
    if (!seat) return
    dispatch(releaseSeat({ seatId: seat.id }))
  }, [dispatch, seat])

  return (
    <div className="rounded-lg bg-neutral-800 p-4 shadow-md w-full max-w-sm">
      <div className="text-lg font-semibold mb-2">Booking</div>
      {!seat && <div className="text-neutral-400 text-sm">Select a seat to start</div>}
      {seat && (
        <div className="space-y-2">
          <div className="text-sm">Seat: <span className="text-neutral-200">{seat.row}{seat.number}</span></div>
          {seat.status === 'locked' && seat.lockedBy === effectiveId && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-neutral-400">Time remaining</div>
              <CountdownTimer target={seat.lockExpiresAt} onExpire={onExpire} />
            </div>
          )}
          <div className="pt-2">
            <button disabled={!seat || seat.status !== 'locked' || seat.lockedBy !== effectiveId} onClick={onConfirm} className="px-3 py-2 rounded bg-emerald-500 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400">
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

