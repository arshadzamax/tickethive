import { shallowEqual } from 'react-redux'

export const selectSeatsState = state => state.seats
export const selectAllSeats = state => state.seats.seats
export const selectSeatById = (state, id) => state.seats.seats.find(s => s.id === id) || null
export const selectSelectedSeat = state => state.seats.selectedSeat
export const selectLoading = state => state.seats.loading
export const selectConnectionStatus = state => state.seats.connectionStatus

import { createSelector } from '@reduxjs/toolkit'

export const makeSelectSeatIds = () => createSelector(
  [selectAllSeats],
  seats => seats.map(s => s.id)
)

export const makeSelectSeatsByRow = () => createSelector(
  [selectAllSeats],
  seats => {
    const rows = {}
    for (const s of seats) {
      if (!rows[s.row]) rows[s.row] = []
      rows[s.row].push(s)
    }
    Object.values(rows).forEach(arr => arr.sort((a, b) => a.number - b.number))
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
