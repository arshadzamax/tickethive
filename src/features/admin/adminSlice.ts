import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient'
import type { ApiErrorPayload, AdminState } from '../../types'

type StatsResponse = { stats: unknown; [key: string]: unknown }

type ResetSeatsResponse = { message: string; [key: string]: unknown }

type ResizeGridPayload = { rows: number; cols: number; eventId: string | number }

type AdminThunkApiConfig = {
    rejectValue: ApiErrorPayload
}

export const fetchStats = createAsyncThunk<StatsResponse, string | number, AdminThunkApiConfig>(
    'admin/fetchStats',
    async (eventId, { rejectWithValue }) => {
        try {
            const res = await api.get(`/admin/events/${eventId}/stats`)
            return res.data as StatsResponse
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Failed to fetch stats' })
        }
    }
)

export const resetSeats = createAsyncThunk<ResetSeatsResponse, string | number, AdminThunkApiConfig>(
    'admin/resetSeats',
    async (eventId, { rejectWithValue }) => {
        try {
            const res = await api.post(`/admin/events/${eventId}/seats/reset`)
            return res.data as ResetSeatsResponse
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Reset failed' })
        }
    }
)

export const adminLockSeat = createAsyncThunk<unknown, { seatId: string | number; eventId: string | number }, AdminThunkApiConfig>(
    'admin/lockSeat',
    async ({ seatId, eventId }, { rejectWithValue }) => {
        try {
            const res = await api.post(`/admin/events/${eventId}/seats/${seatId}/lock`)
            return res.data as unknown
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Lock failed' })
        }
    }
)

export const adminUnlockSeat = createAsyncThunk<unknown, { seatId: string | number; eventId: string | number }, AdminThunkApiConfig>(
    'admin/unlockSeat',
    async ({ seatId, eventId }, { rejectWithValue }) => {
        try {
            const res = await api.post(`/admin/events/${eventId}/seats/${seatId}/unlock`)
            return res.data as unknown
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Unlock failed' })
        }
    }
)

export const resizeGrid = createAsyncThunk<StatsResponse, ResizeGridPayload, AdminThunkApiConfig>(
    'admin/resizeGrid',
    async ({ rows, cols, eventId }, { rejectWithValue }) => {
        try {
            const res = await api.put(`/admin/events/${eventId}/seats/resize`, { rows, cols })
            return res.data as StatsResponse
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Resize failed' })
        }
    }
)

const initialState: AdminState = {
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
                const payload = action.payload as { message?: string }
                state.actionMessage = payload.message || 'Seats reset'
            })
            .addCase(resetSeats.rejected, (state, action) => {
                state.actionLoading = false
                state.error = action.payload?.message || 'Reset failed'
            })

            .addCase(resizeGrid.pending, state => { state.actionLoading = true })
            .addCase(resizeGrid.fulfilled, (state, action) => {
                state.actionLoading = false
                state.stats = action.payload.stats
                const payload = action.payload as { message?: string }
                state.actionMessage = payload.message || 'Grid resized'
            })
            .addCase(resizeGrid.rejected, (state, action) => {
                state.actionLoading = false
                state.error = action.payload?.message || 'Resize failed'
            })
    }
})

export const { clearActionMessage, clearAdminError } = adminSlice.actions
export default adminSlice.reducer

export const selectAdminStats = (state: { admin: AdminState }) => state.admin.stats
export const selectAdminLoading = (state: { admin: AdminState }) => state.admin.loading
export const selectAdminActionLoading = (state: { admin: AdminState }) => state.admin.actionLoading
export const selectAdminError = (state: { admin: AdminState }) => state.admin.error
export const selectAdminActionMessage = (state: { admin: AdminState }) => state.admin.actionMessage
