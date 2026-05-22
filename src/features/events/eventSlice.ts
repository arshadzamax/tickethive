import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient'
import type { ApiErrorPayload, Event, EventsState } from '../../types'

type EventFormData = unknown

type EventsThunkApiConfig = {
  rejectValue: ApiErrorPayload
}

export const fetchEvents = createAsyncThunk<Event[], void, EventsThunkApiConfig>(
  'events/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/events')
      return res.data as Event[]
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch events' })
    }
  }
)

export const createEvent = createAsyncThunk<Event, EventFormData, EventsThunkApiConfig>(
  'events/createEvent',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/events', formData)
      return res.data as Event
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to create event' })
    }
  }
)

export const updateEvent = createAsyncThunk<Event, { eventId: string | number; formData: EventFormData }, EventsThunkApiConfig>(
  'events/updateEvent',
  async ({ eventId, formData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/events/${eventId}`, formData)
      return res.data as Event
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to update event' })
    }
  }
)

export const cancelEvent = createAsyncThunk<Event, string | number, EventsThunkApiConfig>(
  'events/cancelEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/events/${eventId}/status`)
      return res.data as Event
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to cancel event' })
    }
  }
)

export const deleteEvent = createAsyncThunk<string, string | number, EventsThunkApiConfig>(
  'events/deleteEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      await api.delete(`/events/${eventId}`)
      return String(eventId)
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to delete event' })
    }
  }
)

const initialState: EventsState = {
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

export const selectAllEvents = (state: { events: EventsState }) => state.events.events
export const selectEventsLoading = (state: { events: EventsState }) => state.events.loading
export const selectEventsError = (state: { events: EventsState }) => state.events.error
export const selectCreating = (state: { events: EventsState }) => state.events.creating
export const selectCreateError = (state: { events: EventsState }) => state.events.createError
