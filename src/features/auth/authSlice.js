import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

const TOKEN_KEY = 'th_token'

function loadToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || null
    } catch {
        return null
    }
}

function saveToken(token) {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
    } catch { }
}

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
    try {
        const res = await api.post('/auth/login', { email, password })
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Login failed' })
    }
})

export const registerUser = createAsyncThunk('auth/register', async ({ email, password }, { rejectWithValue }) => {
    try {
        const res = await api.post('/auth/register', { email, password })
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Registration failed' })
    }
})

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
    try {
        const res = await api.get('/auth/me')
        return res.data
    } catch (e) {
        return rejectWithValue(e.response?.data || { message: 'Not authenticated' })
    }
})

const initialToken = loadToken()

const initialState = {
    user: null,
    token: initialToken,
    loading: false,
    error: null,
    initialized: !initialToken  // if no token to restore, we're already initialized
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null
            state.token = null
            state.error = null
            saveToken(null)
        },
        clearAuthError(state) {
            state.error = null
        }
    },
    extraReducers: builder => {
        builder
            // Login
            .addCase(loginUser.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.token = action.payload.token
                state.initialized = true
                saveToken(action.payload.token)
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.message || 'Login failed'
            })

            // Register
            .addCase(registerUser.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.token = action.payload.token
                state.initialized = true
                saveToken(action.payload.token)
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.message || 'Registration failed'
            })

            // Fetch current user (token restore)
            .addCase(fetchCurrentUser.pending, state => {
                state.loading = true
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload
                state.initialized = true
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.loading = false
                state.user = null
                state.token = null
                state.initialized = true
                saveToken(null)
            })
    }
})

export const { logout, clearAuthError } = authSlice.actions
export default authSlice.reducer

export const selectUser = state => state.auth.user
export const selectToken = state => state.auth.token
export const selectAuthLoading = state => state.auth.loading
export const selectAuthError = state => state.auth.error
export const selectAuthInitialized = state => state.auth.initialized
export const selectIsAdmin = state => state.auth.user?.role === 'admin'
