import React, { useMemo, useCallback } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { holdSeat, releaseSeat } from './seatSlice.js'
import { selectSeatById, selectSelectedSeat } from './seatSelectors.js'
import { seatPosition, seatFill, isLockedByOther, isAdminLocked } from '../../utils/seatHelpers.js'
import { selectEffectiveUserId } from '../../utils/identity.js'

function SeatItemInner({ seatId, cell = 24, gap = 8 }) {
  const seat = useSelector(state => selectSeatById(state, seatId), shallowEqual)
  const dispatch = useDispatch()
  const selected = useSelector(selectSelectedSeat, shallowEqual)
  const effectiveId = useSelector(selectEffectiveUserId)
  const pos = useMemo(() => seatPosition(seat, { cell, gap, rowsTop: 20, colsLeft: 20 }), [seat, cell, gap])
  const fill = useMemo(() => seatFill(seat, effectiveId), [seat, effectiveId])
  const adminLocked = isAdminLocked(seat)

  const onClick = useCallback(() => {
    if (!seat) return
    if (adminLocked) {
      const ev = new CustomEvent('th_toast', { detail: { message: 'This seat is reserved by admin' } })
      window.dispatchEvent(ev)
      return
    }
    if (isLockedByOther(seat, effectiveId)) {
      const ev = new CustomEvent('th_toast', { detail: { message: 'Seat already locked' } })
      window.dispatchEvent(ev)
      return
    }
    if (seat.status === 'available') {
      if (selected && selected.id !== seat.id && selected.status === 'locked' && selected.lockedBy === effectiveId) {
        dispatch(releaseSeat({ seatId: selected.id })).finally(() => dispatch(holdSeat({ seatId: seat.id, effectiveUserId: effectiveId })))
        return
      }
      dispatch(holdSeat({ seatId: seat.id, effectiveUserId: effectiveId }))
    }
  }, [seat, dispatch, selected, adminLocked, effectiveId])

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
