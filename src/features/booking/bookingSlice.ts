import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/apiClient'
import type { ApiErrorPayload, BookingState, AddonItem } from '../../types'

type HoldBookingPayload = {
  eventId: string | number
  bookingItems: import('../../types').BookingItems
}

type AddonPayload = {
  addonId: string
  quantity: number
}

type ReleaseBookingPayload = {
  eventId: string | number
  groupLockId?: string | null
  bookingItems: import('../../types').BookingItems
}

type CreateGroupBookingPayload = {
  eventId: string | number
  bookingItems: import('../../types').BookingItems
  groupLockId?: string | null
  addonItems?: AddonPayload[]
  promoCode?: string | null
}

type GroupBookingResponse = {
  groupBookingId: string | number
  groupLockId?: string
  [key: string]: unknown
}

type BookingThunkApiConfig = {
  rejectValue: ApiErrorPayload
}

export const holdBooking = createAsyncThunk<GroupBookingResponse, HoldBookingPayload, BookingThunkApiConfig>(
  'booking/hold',
  async ({ eventId, bookingItems }, { rejectWithValue }) => {
    try {
      const res = await api.post('/group-bookings/hold', { eventId, bookingItems })
      return res.data as GroupBookingResponse
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to hold booking' })
    }
  }
)

export const releaseBooking = createAsyncThunk<string | null, ReleaseBookingPayload, BookingThunkApiConfig>(
  'booking/release',
  async ({ eventId, groupLockId, bookingItems }, { rejectWithValue }) => {
    try {
      await api.post('/group-bookings/release', { eventId, groupLockId, bookingItems })
      return groupLockId ?? null
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to release booking' })
    }
  }
)

export const createGroupBooking = createAsyncThunk<GroupBookingResponse, CreateGroupBookingPayload, BookingThunkApiConfig>(
  'booking/createGroup',
  async ({ eventId, bookingItems, groupLockId, addonItems, promoCode }, { rejectWithValue }) => {
    try {
      const res = await api.post('/group-bookings', {
        eventId,
        bookingItems,
        groupLockId,
        paymentStatus: 'pending',
        addonItems: addonItems || [],
        promoCode: promoCode || null,
      })
      return res.data as GroupBookingResponse
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to create group booking' })
    }
  }
)

export const getGroupBooking = createAsyncThunk<unknown, string | number, BookingThunkApiConfig>(
  'booking/getGroup',
  async (groupBookingId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/group-bookings/${groupBookingId}`)
      return res.data as unknown
    } catch (error) {
      const err = error as { response?: { data?: ApiErrorPayload } }
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch group booking' })
    }
  }
)

const initialState: BookingState = {
  // Legacy support
  bookingStatus: 'idle',
  error: null,

  // Group booking state
  selectedItems: [], // For SEATED: seat IDs, For GENERAL: { quantity, category }
  groupLockId: null,
  holdingStatus: 'idle',
  creatingStatus: 'idle',
  currentGroupBooking: null,
  totalPrice: 0,
  eventType: null, // 'SEATED' or 'GENERAL'

  // Add-ons & Promo
  addonItems: [], // [{ addonId, name, quantity, pricePerUnit }]
  promoCode: '',
  promoValidation: null, // { valid, discountType, discountValue, code } | null
  discountAmount: 0,
}

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    selectSeat: (state, action: PayloadAction<string | number>) => {
      const seatId = action.payload
      if (!Array.isArray(state.selectedItems) || !state.selectedItems.includes(seatId)) {
        state.selectedItems = Array.isArray(state.selectedItems) ? [...state.selectedItems, seatId] : [seatId]
      }
    },
    deselectSeat: (state, action: PayloadAction<string | number>) => {
      const seatId = action.payload
      if (Array.isArray(state.selectedItems)) {
        state.selectedItems = state.selectedItems.filter(id => id !== seatId)
      }
    },
    clearSelectedSeats: (state) => {
      state.selectedItems = []
      state.groupLockId = null
    },
    setTicketSelection: (state, action: PayloadAction<{ quantity: number; category: string }>) => {
      state.selectedItems = { quantity: action.payload.quantity, category: action.payload.category }
    },
    clearTicketSelection: (state) => {
      state.selectedItems = []
      state.groupLockId = null
    },
    setEventType: (state, action: PayloadAction<'SEATED' | 'GENERAL' | null>) => {
      state.eventType = action.payload
    },
    setTotalPrice: (state, action: PayloadAction<number>) => {
      state.totalPrice = action.payload
    },
    resetBooking: (state) => {
      state.selectedItems = []
      state.groupLockId = null
      state.totalPrice = 0
      state.holdingStatus = 'idle'
      state.creatingStatus = 'idle'
      state.currentGroupBooking = null
      state.error = null
      state.addonItems = []
      state.promoCode = ''
      state.promoValidation = null
      state.discountAmount = 0
    },
    setAddonItem: (state, action: PayloadAction<AddonItem>) => {
      const { addonId, name, quantity, pricePerUnit } = action.payload
      const existing = state.addonItems.findIndex(a => a.addonId === addonId)
      if (quantity <= 0) {
        if (existing !== -1) state.addonItems.splice(existing, 1)
      } else if (existing !== -1) {
        state.addonItems[existing] = { addonId, name, quantity, pricePerUnit }
      } else {
        state.addonItems.push({ addonId, name, quantity, pricePerUnit })
      }
    },
    setPromoCode: (state, action: PayloadAction<string>) => {
      state.promoCode = action.payload
    },
    setPromoValidation: (state, action: PayloadAction<BookingState['promoValidation']>) => {
      state.promoValidation = action.payload
      if (!action.payload || !action.payload.valid) {
        state.discountAmount = 0
      }
    },
    applyDiscount: (state, action: PayloadAction<{ ticketSubtotal: number }>) => {
      const { ticketSubtotal } = action.payload
      const promo = state.promoValidation
      if (!promo || !promo.valid) {
        state.discountAmount = 0
        return
      }
      if (promo.discountType === 'pct') {
        state.discountAmount = Math.round((ticketSubtotal * promo.discountValue / 100) * 100) / 100
      } else {
        state.discountAmount = Math.min(promo.discountValue, ticketSubtotal)
      }
    },
  },
  extraReducers: builder => {
    builder
      // Hold booking
      .addCase(holdBooking.pending, state => {
        state.holdingStatus = 'loading'
        state.error = null
      })
      .addCase(holdBooking.fulfilled, (state, action) => {
        state.holdingStatus = 'success'
        state.groupLockId = action.payload.groupLockId ?? null
      })
      .addCase(holdBooking.rejected, (state, action) => {
        state.holdingStatus = 'failed'
        state.error = action.payload?.message || 'Failed to hold booking'
      })

      // Release booking
      .addCase(releaseBooking.pending, state => {
        state.holdingStatus = 'loading'
      })
      .addCase(releaseBooking.fulfilled, (state) => {
        state.selectedItems = []
        state.groupLockId = null
        state.holdingStatus = 'idle'
      })
      .addCase(releaseBooking.rejected, (state, action) => {
        state.error = (action.payload as ApiErrorPayload)?.message || 'Failed to release booking'
      })

      // Create group booking
      .addCase(createGroupBooking.pending, state => {
        state.creatingStatus = 'loading'
        state.error = null
      })
      .addCase(createGroupBooking.fulfilled, (state, action) => {
        state.creatingStatus = 'success'
        state.currentGroupBooking = action.payload
        state.selectedItems = []
        state.groupLockId = null
      })
      .addCase(createGroupBooking.rejected, (state, action) => {
        state.creatingStatus = 'failed'
        state.error = action.payload?.message || 'Failed to create booking'
      })

      // Get group booking
      .addCase(getGroupBooking.pending, state => {
        state.holdingStatus = 'loading'
      })
      .addCase(getGroupBooking.fulfilled, (state, action) => {
        state.currentGroupBooking = action.payload
        state.holdingStatus = 'idle'
      })
      .addCase(getGroupBooking.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to fetch booking'
      })
  }
})

export const {
  selectSeat,
  deselectSeat,
  clearSelectedSeats,
  setTicketSelection,
  clearTicketSelection,
  setEventType,
  setTotalPrice,
  resetBooking,
  setAddonItem,
  setPromoCode,
  setPromoValidation,
  applyDiscount,
} = bookingSlice.actions

export default bookingSlice.reducer