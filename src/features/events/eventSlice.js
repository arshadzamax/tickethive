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

export const updateEvent = createAsyncThunk('events/updateEvent', async ({ eventId, formData }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/events/${eventId}`, formData)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to update event' })
  }
})

export const cancelEvent = createAsyncThunk('events/cancelEvent', async (eventId, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/events/${eventId}/status`)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to cancel event' })
  }
})

export const deleteEvent = createAsyncThunk('events/deleteEvent', async (eventId, { rejectWithValue }) => {
  try {
    await api.delete(`/events/${eventId}`)
    return eventId
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to delete event' })
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
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e.id === action.payload.id)
        if (index !== -1) {
          state.events[index] = action.payload
        }
      })
      .addCase(cancelEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e.id === action.payload.id)
        if (index !== -1) {
          state.events[index] = action.payload
        }
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(e => e.id !== action.payload)
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
