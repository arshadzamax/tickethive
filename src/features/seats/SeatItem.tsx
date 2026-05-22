import React, { useMemo, useCallback } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { holdSeat, releaseSeat } from './seatSlice'
import { selectSeatById, selectSelectedSeat } from './seatSelectors'
import { seatPosition, seatFill, isLockedByOther, isAdminLocked } from '../../utils/seatHelpers'
import { selectEffectiveUserId } from '../../utils/identity'
import type { Seat } from '../../types'
import type { RootState } from '../../app/store'

function SeatItemInner({
  seatId,
  eventId,
  cell = 24,
  gap = 8,
}: {
  seatId: string | number
  eventId?: string | number
  cell?: number
  gap?: number
}) {
  const seat = useSelector((state: RootState) => selectSeatById(state, seatId), shallowEqual) as Seat | null
  const dispatch = useDispatch()
  const selected = useSelector(selectSelectedSeat, shallowEqual)
  const effectiveId = useSelector(selectEffectiveUserId)
  const pos = useMemo(() => (seat ? seatPosition(seat, { cell, gap, rowsTop: 20, colsLeft: 20 }) : { x: 0, y: 0 }), [seat, cell, gap])
  const fill = useMemo(() => (seat ? seatFill(seat, effectiveId) : '#111'), [seat, effectiveId])
  const adminLocked = seat ? isAdminLocked(seat) : false

  const onClick = useCallback(() => {
    if (!seat) return
    if (adminLocked) {
      const ev = new CustomEvent('th_toast', { detail: { message: 'This seat is reserved by admin' } })
      window.dispatchEvent(ev)
      return
    }
    if (seat && isLockedByOther(seat, effectiveId)) {
      const ev = new CustomEvent('th_toast', { detail: { message: 'Seat already locked' } })
      window.dispatchEvent(ev)
      return
    }
    if (seat.status === 'available') {
      if (!eventId) return
      if (selected && seat && selected.id !== seat.id && selected.status === 'locked' && selected.lockedBy === effectiveId) {
        dispatch(releaseSeat({ seatId: selected.id, eventId })).finally(() => dispatch(holdSeat({ seatId: seat.id, eventId, effectiveUserId: effectiveId })))
        return
      }
      if (seat) {
        dispatch(holdSeat({ seatId: seat.id, eventId, effectiveUserId: effectiveId }))
      }
    }
  }, [seat, dispatch, selected, adminLocked, effectiveId, eventId])

  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      <circle r={cell / 2} cx={0} cy={0} fill={fill} className="seat-transition cursor-pointer hover:scale-105" onClick={onClick} />
      {adminLocked && (
        <text x={0} y={4} textAnchor="middle" fontSize={9} fill="white" pointerEvents="none">🔒</text>
      )}
    </g>
  )
}

const SeatItem = React.memo(SeatItemInner)
export default SeatItem
