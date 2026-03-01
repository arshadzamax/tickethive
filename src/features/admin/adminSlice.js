import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

export const fetchStats = createAsyncThunk('admin/fetchStats', async (_, { rejectWithValue }) => {
    try {
        const res = await api.get('/admin/stats')
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Failed to fetch stats' })
    }
})

export const resetSeats = createAsyncThunk('admin/resetSeats', async (_, { rejectWithValue }) => {
    try {
        const res = await api.post('/admin/seats/reset')
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Reset failed' })
    }
})

export const adminLockSeat = createAsyncThunk('admin/lockSeat', async (seatId, { rejectWithValue }) => {
    try {
        const res = await api.post(`/admin/seats/${seatId}/lock`)
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Lock failed' })
    }
})

export const adminUnlockSeat = createAsyncThunk('admin/unlockSeat', async (seatId, { rejectWithValue }) => {
    try {
        const res = await api.post(`/admin/seats/${seatId}/unlock`)
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Unlock failed' })
    }
})

export const resizeGrid = createAsyncThunk('admin/resizeGrid', async ({ rows, cols }, { rejectWithValue }) => {
    try {
        const res = await api.put('/admin/seats/resize', { rows, cols })
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Resize failed' })
    }
})

const initialState = {
    stats: null,
    loading: false,
    actionLoading: false,
    error: null,
    actionMessage: null
}

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        clearActionMessage(state) {
            state.actionMessage = null
        },
        clearAdminError(state) {
            state.error = null
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchStats.pending, state => { state.loading = true })
            .addCase(fetchStats.fulfilled, (state, action) => {
                state.loading = false
                state.stats = action.payload
            })
            .addCase(fetchStats.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.message || 'Failed to fetch stats'
            })

            .addCase(resetSeats.pending, state => { state.actionLoading = true })
            .addCase(resetSeats.fulfilled, (state, action) => {
                state.actionLoading = false
                state.actionMessage = action.payload.message || 'Seats reset'
            })
            .addCase(resetSeats.rejected, (state, action) => {
                state.actionLoading = false
                state.error = action.payload?.message || 'Reset failed'
            })

            .addCase(resizeGrid.pending, state => { state.actionLoading = true })
            .addCase(resizeGrid.fulfilled, (state, action) => {
                state.actionLoading = false
                state.stats = action.payload.stats
                state.actionMessage = action.payload.message || 'Grid resized'
            })
            .addCase(resizeGrid.rejected, (state, action) => {
                state.actionLoading = false
                state.error = action.payload?.message || 'Resize failed'
            })
    }
})

export const { clearActionMessage, clearAdminError } = adminSlice.actions
export default adminSlice.reducer

export const selectAdminStats = state => state.admin.stats
export const selectAdminLoading = state => state.admin.loading
export const selectAdminActionLoading = state => state.admin.actionLoading
export const selectAdminError = state => state.admin.error
export const selectAdminActionMessage = state => state.admin.actionMessage
