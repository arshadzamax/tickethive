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

export const createEvent = createAsyncThunk('events/createEvent', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post('/events', formData)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to create event' })
  }
})

const initialState = {
  events: [],
  loading: false,
  error: null,
  creating: false,
  createError: null
}

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCreateError(state) {
      state.createError = null
    }
  },
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
      .addCase(createEvent.pending, state => {
        state.creating = true
        state.createError = null
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.creating = false
        state.events = [...state.events, action.payload]
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.creating = false
        state.createError = action.payload?.message || 'Failed to create event'
      })
  }
})

export const { clearCreateError } = eventsSlice.actions
export default eventsSlice.reducer

export const selectAllEvents = state => state.events.events
export const selectEventsLoading = state => state.events.loading
export const selectEventsError = state => state.events.error
export const selectCreating = state => state.events.creating
export const selectCreateError = state => state.events.createError
