import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

export const fetchEvents = createAsyncThunk('events/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/events')
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to fetch events' })
  }
})

const initialState = {
  events: [],
  loading: false,
  error: null
}

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchEvents.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false
        state.events = action.payload
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to fetch events'
      })
  }
})

export default eventsSlice.reducer

export const selectAllEvents = state => state.events.events
export const selectEventsLoading = state => state.events.loading
export const selectEventsError = state => state.events.error
