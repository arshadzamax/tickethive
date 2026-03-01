import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

import { normalizeSeat } from '../../utils/seatHelpers.js'
import { applySeatSold } from '../seats/seatSlice.js'

export const confirmBooking = createAsyncThunk('booking/confirm', async (seatId, { rejectWithValue, dispatch }) => {
  try {
    const res = await api.post(`/seats/${seatId}/confirm`)
    const seat = normalizeSeat(res.data)
    // update seat slice immediately so UI reflects sold state
    dispatch(applySeatSold(seat))
    return seat
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Confirm failed' })
  }
})

const initialState = {
  bookingStatus: 'idle',
  paymentStatus: 'idle',
  error: null
}

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(confirmBooking.pending, state => {
        state.bookingStatus = 'processing'
        state.error = null
      })
      .addCase(confirmBooking.fulfilled, state => {
        state.bookingStatus = 'confirmed'
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.bookingStatus = 'idle'
        state.error = action.payload?.message || 'Confirm failed'
      })
  }
})

export default bookingSlice.reducer

