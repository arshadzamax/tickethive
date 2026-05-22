import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/apiClient'
import { LOCK_DURATION_MS, SEAT_STATUS } from '../../utils/constants'
import { normalizeSeat, normalizeSeats } from '../../utils/seatHelpers'
import type { ApiErrorPayload, SeatsState, Seat } from '../../types'

type SeatActionPayload = string | number

type FetchSeatsThunkApiConfig = {
  rejectValue: ApiErrorPayload
}

type HoldSeatPayload = {
  seatId: string | number
  eventId: string | number
  effectiveUserId: string | number
}

type ReleaseSeatPayload = {
  seatId: string | number
  eventId: string | number
}

export const fetchSeats = createAsyncThunk<Seat[], string | number, FetchSeatsThunkApiConfig>(
  'seats/fetchSeats',
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/events/${eventId}/seats`)
      return normalizeSeats(res.data as unknown[]) as Seat[]
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch seats' })
    }
  }
)

export const holdSeat = createAsyncThunk<Seat, HoldSeatPayload, FetchSeatsThunkApiConfig>(
  'seats/holdSeat',
  async ({ seatId, eventId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/events/${eventId}/seats/${seatId}/hold`)
      return normalizeSeat(res.data as unknown) as Seat
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Hold failed' })
    }
  }
)

export const releaseSeat = createAsyncThunk<Seat, ReleaseSeatPayload, FetchSeatsThunkApiConfig>(
  'seats/releaseSeat',
  async ({ seatId, eventId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/events/${eventId}/seats/${seatId}/release`)
      return normalizeSeat(res.data as unknown) as Seat
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Release failed' })
    }
  }
)

const initialState: SeatsState = {
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
    applySeatLocked(state, action: PayloadAction<unknown>) {
      const seat = normalizeSeat(action.payload) as Seat
      const idx = state.seats.findIndex(s => s.id === seat.id)
      if (idx !== -1) state.seats[idx] = seat
      if (state.selectedSeat && state.selectedSeat.id === seat.id) state.selectedSeat = seat
    },
    applySeatSold(state, action: PayloadAction<unknown>) {
      const seat = normalizeSeat(action.payload) as Seat
      const idx = state.seats.findIndex(s => s.id === seat.id)
      if (idx !== -1) state.seats[idx] = seat
      if (state.selectedSeat && state.selectedSeat.id === seat.id) state.selectedSeat = seat
    },
    applySeatReleased(state, action: PayloadAction<unknown>) {
      const seat = normalizeSeat(action.payload) as Seat
      const idx = state.seats.findIndex(s => s.id === seat.id)
      if (idx !== -1) state.seats[idx] = seat
      if (state.selectedSeat && state.selectedSeat.id === seat.id) state.selectedSeat = seat
    },
    setSelectedSeat(state, action: PayloadAction<Seat | null>) {
      state.selectedSeat = action.payload
    },
    setConnectionStatus(state, action: PayloadAction<SeatsState['connectionStatus']>) {
      state.connectionStatus = action.payload
    },
    expireSeatLock(state, action: PayloadAction<string | number>) {
      const seatId = action.payload
      const idx = state.seats.findIndex(s => s.id === seatId)
      if (idx !== -1) {
        const s = state.seats[idx]
        if (!s) return
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
        state.seats = action.payload
      })
      .addCase(fetchSeats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to load seats'
      })

      .addCase(holdSeat.pending, (state, action) => {
        const { seatId, effectiveUserId } = action.meta.arg
        const idx = state.seats.findIndex(s => s.id === seatId)
        if (idx !== -1) {
          const s = state.seats[idx]
          if (!s) return
          if (s.status === SEAT_STATUS.available) {
            state.seats[idx] = {
              ...s,
              status: SEAT_STATUS.locked,
              lockedBy: String(effectiveUserId),
              lockExpiresAt: Date.now() + LOCK_DURATION_MS
            }
            const selected = state.seats[idx]
            if (selected) state.selectedSeat = selected
          }
        }
      })
      .addCase(holdSeat.fulfilled, (state, action) => {
        const serverSeat = normalizeSeat(action.payload) as Seat
        const idx = state.seats.findIndex(s => s.id === serverSeat.id)
        if (idx !== -1) state.seats[idx] = serverSeat
        state.selectedSeat = serverSeat
      })
      .addCase(holdSeat.rejected, (state, action) => {
        const { seatId } = action.meta.arg
        const idx = state.seats.findIndex(s => s.id === seatId)
        if (idx !== -1) {
          const s = state.seats[idx]
          if (!s) return
          state.seats[idx] = { ...s, status: SEAT_STATUS.available, lockedBy: null, lockExpiresAt: null }
        }
        state.error = action.payload?.message || 'Hold failed'
      })

      .addCase(releaseSeat.fulfilled, (state, action) => {
        const seat = normalizeSeat(action.payload) as Seat
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

