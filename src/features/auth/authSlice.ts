import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient'
import type { ApiErrorPayload, AuthResponse, AuthState, User } from '../../types'

const TOKEN_KEY = 'th_token'

function loadToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY) || null
    } catch {
        return null
    }
}

function saveToken(token: string | null) {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
    } catch { }
}

type AuthThunkApiConfig = {
    rejectValue: ApiErrorPayload
}

export const loginUser = createAsyncThunk<AuthResponse, { email: string; password: string }, AuthThunkApiConfig>(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await api.post('/auth/login', { email, password })
            return res.data as AuthResponse
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Login failed' })
        }
    }
)

export const registerUser = createAsyncThunk<AuthResponse, { email: string; password: string }, AuthThunkApiConfig>(
    'auth/register',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await api.post('/auth/register', { email, password })
            return res.data as AuthResponse
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Registration failed' })
        }
    }
)

export const fetchCurrentUser = createAsyncThunk<User, void, AuthThunkApiConfig>(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/auth/me')
            return res.data as User
        } catch (error) {
            const err = error as { response?: { data?: ApiErrorPayload } }
            return rejectWithValue(err.response?.data || { message: 'Not authenticated' })
        }
    }
)

const initialToken = loadToken()

const initialState: AuthState = {
    user: null,
    token: initialToken,
    loading: false,
    error: null,
    initialized: !initialToken
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
            .addCase(fetchCurrentUser.pending, state => {
                state.loading = true
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload
                state.initialized = true
            })
            .addCase(fetchCurrentUser.rejected, state => {
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

export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectToken = (state: { auth: AuthState }) => state.auth.token
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectAuthInitialized = (state: { auth: AuthState }) => state.auth.initialized
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.user?.role === 'admin'
