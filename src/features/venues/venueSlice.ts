import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/apiClient'
import type { ApiErrorPayload, Venue, VenuesState } from '../../types'

type VenueItem = Venue

type VenuesThunkApiConfig = {
  rejectValue: ApiErrorPayload
}

export const fetchVenues = createAsyncThunk<VenueItem[], void, VenuesThunkApiConfig>(
  'venues/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/venues')
      return response.data as VenueItem[]
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch venues' })
    }
  }
)

export const createVenue = createAsyncThunk<VenueItem, unknown, VenuesThunkApiConfig>(
  'venues/create',
  async (venueData, { rejectWithValue }) => {
    try {
      const response = await api.post('/venues', venueData)
      return response.data as VenueItem
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to create venue' })
    }
  }
)

const initialState: VenuesState = {
  list: [],
  loading: false,
  error: null,
  creating: false,
  createError: null,
}

const venueSlice = createSlice({
  name: 'venues',
  initialState,
  reducers: {
    clearCreateError: (state) => {
      state.createError = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message ?? 'Failed to fetch venues'
      })
      .addCase(createVenue.pending, (state) => {
        state.creating = true
        state.createError = null
      })
      .addCase(createVenue.fulfilled, (state, action) => {
        state.creating = false
        state.list.push(action.payload)
      })
      .addCase(createVenue.rejected, (state, action) => {
        state.creating = false
        state.createError = action.payload?.message ?? 'Failed to create venue'
      })
  }
})

export const { clearCreateError } = venueSlice.actions

export const selectAllVenues = (state: { venues: VenuesState }) => state.venues.list
export const selectVenuesLoading = (state: { venues: VenuesState }) => state.venues.loading
export const selectVenuesError = (state: { venues: VenuesState }) => state.venues.error
export const selectCreatingVenue = (state: { venues: VenuesState }) => state.venues.creating
export const selectCreateVenueError = (state: { venues: VenuesState }) => state.venues.createError

export default venueSlice.reducer
