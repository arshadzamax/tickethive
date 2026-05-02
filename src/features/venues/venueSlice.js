import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

export const fetchVenues = createAsyncThunk(
  'venues/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/venues')
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch venues')
    }
  }
)

export const createVenue = createAsyncThunk(
  'venues/create',
  async (venueData, { rejectWithValue }) => {
    try {
      const response = await api.post('/venues', venueData)
      return response.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create venue')
    }
  }
)

const venueSlice = createSlice({
  name: 'venues',
  initialState: {
    list: [],
    loading: false,
    error: null,
    creating: false,
    createError: null,
  },
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
        state.error = action.payload
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
        state.createError = action.payload
      })
  }
})

export const { clearCreateError } = venueSlice.actions

export const selectAllVenues = state => state.venues.list
export const selectVenuesLoading = state => state.venues.loading
export const selectVenuesError = state => state.venues.error
export const selectCreatingVenue = state => state.venues.creating
export const selectCreateVenueError = state => state.venues.createError

export default venueSlice.reducer
