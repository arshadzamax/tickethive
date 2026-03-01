import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'
import { LOCK_DURATION_MS, SEAT_STATUS } from '../../utils/constants.js'
import { normalizeSeat, normalizeSeats } from '../../utils/seatHelpers.js'

export const fetchSeats = createAsyncThunk('seats/fetchSeats', async () => {
  const res = await api.get('/seats')
  return res.data
})

export const holdSeat = createAsyncThunk('seats/holdSeat', async ({ seatId, effectiveUserId }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/seats/${seatId}/hold`)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Hold failed' })
  }
})

export const releaseSeat = createAsyncThunk('seats/releaseSeat', async ({ seatId }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/seats/${seatId}/release`)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Release failed' })
  }
})

const initialState = {
  seats: [],
  selectedSeat: null,
  loading: false,
  error: null,
  connectionStatus: 'disconnected'
}

const seatsSlice = createSlice({
  name: 'seats',
  initialState,
  reducers: {
    applySeatLocked(state, action) {
      const seat = normalizeSeat(action.payload)
      const idx = state.seats.findIndex(s => s.id === seat.id)
      if (idx !== -1) state.seats[idx] = seat
      if (state.selectedSeat && state.selectedSeat.id === seat.id) state.selectedSeat = seat
    },
    applySeatSold(state, action) {
      const seat = normalizeSeat(action.payload)
      const idx = state.seats.findIndex(s => s.id === seat.id)
      if (idx !== -1) state.seats[idx] = seat
      if (state.selectedSeat && state.selectedSeat.id === seat.id) state.selectedSeat = seat
    },
    applySeatReleased(state, action) {
      const seat = normalizeSeat(action.payload)
      const idx = state.seats.findIndex(s => s.id === seat.id)
      if (idx !== -1) state.seats[idx] = seat
      if (state.selectedSeat && state.selectedSeat.id === seat.id) state.selectedSeat = seat
    },
    setSelectedSeat(state, action) {
      state.selectedSeat = action.payload
    },
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload
    },
    expireSeatLock(state, action) {
      const seatId = action.payload
      const idx = state.seats.findIndex(s => s.id === seatId)
      if (idx !== -1) {
        const s = state.seats[idx]
        if (s.status === SEAT_STATUS.locked && s.lockExpiresAt && Date.now() >= s.lockExpiresAt) {
          state.seats[idx] = { ...s, status: SEAT_STATUS.available, lockedBy: null, lockExpiresAt: null }
        }
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSeats.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSeats.fulfilled, (state, action) => {
        state.loading = false
        // normalize server response to camelCase and numeric timestamps
        state.seats = normalizeSeats(action.payload)
      })
      .addCase(fetchSeats.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load seats'
      })

      .addCase(holdSeat.pending, (state, action) => {
        const { seatId, effectiveUserId } = action.meta.arg
        const idx = state.seats.findIndex(s => s.id === seatId)
        if (idx !== -1) {
          const s = state.seats[idx]
          if (s.status === SEAT_STATUS.available) {
            state.seats[idx] = {
              ...s,
              status: SEAT_STATUS.locked,
              lockedBy: effectiveUserId,
              lockExpiresAt: Date.now() + LOCK_DURATION_MS
            }
            state.selectedSeat = state.seats[idx]
          }
        }
      })
      .addCase(holdSeat.fulfilled, (state, action) => {
        const serverSeat = normalizeSeat(action.payload)
        const idx = state.seats.findIndex(s => s.id === serverSeat.id)
        if (idx !== -1) state.seats[idx] = serverSeat
        state.selectedSeat = serverSeat
      })
      .addCase(holdSeat.rejected, (state, action) => {
        const { seatId } = action.meta.arg
        const idx = state.seats.findIndex(s => s.id === seatId)
        if (idx !== -1) {
          const s = state.seats[idx]
          state.seats[idx] = { ...s, status: SEAT_STATUS.available, lockedBy: null, lockExpiresAt: null }
        }
        state.error = action.payload?.message || 'Hold failed'
      })

      .addCase(releaseSeat.fulfilled, (state, action) => {
        const seat = normalizeSeat(action.payload)
        const idx = state.seats.findIndex(s => s.id === seat.id)
        if (idx !== -1) state.seats[idx] = seat
        if (state.selectedSeat && state.selectedSeat.id === seat.id) state.selectedSeat = seat
      })
  }
})

export const {
  applySeatLocked,
  applySeatSold,
  applySeatReleased,
  setSelectedSeat,
  setConnectionStatus,
  expireSeatLock
} = seatsSlice.actions

export default seatsSlice.reducer

