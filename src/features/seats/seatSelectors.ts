import { shallowEqual } from 'react-redux'
import type { Seat } from '../../types'
import type { RootState } from '../../app/store'

export const selectSeatsState = (state: RootState) => state.seats
export const selectAllSeats = (state: RootState) => state.seats.seats
export const selectSeatById = (state: RootState, id: string | number) => state.seats.seats.find((s: Seat) => s.id === id) || null
export const selectSelectedSeat = (state: RootState) => state.seats.selectedSeat
export const selectLoading = (state: RootState) => state.seats.loading
export const selectConnectionStatus = (state: RootState) => state.seats.connectionStatus

import { createSelector } from '@reduxjs/toolkit'

export const makeSelectSeatIds = () => createSelector(
  [selectAllSeats],
  seats => seats.map(s => s.id)
)

export const makeSelectSeatsByRow = () => createSelector(
  [selectAllSeats],
  seats => {
    const rows: Record<string, Seat[]> = {}
    for (const s of seats) {
      const rowKey = String(s.row ?? '0')
      if (!rows[rowKey]) rows[rowKey] = []
      rows[rowKey].push(s)
    }
    Object.values(rows).forEach(arr => arr.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0)))
    return rows
  }
)

export const shallow = shallowEqual

export const selectLiveStats = createSelector(
  [selectAllSeats],
  seats => {
    const stats = { total: 0, available: 0, locked: 0, sold: 0, adminLocked: 0 }
    for (const s of seats) {
      stats.total++
      if (s.adminLocked || s.admin_locked) {
        stats.adminLocked++
      } else if (s.status === 'sold') {
        stats.sold++
      } else if (s.status === 'locked') {
        stats.locked++
      } else {
        stats.available++
      }
    }
    return stats
  }
)
