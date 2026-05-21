import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

export const holdBooking = createAsyncThunk('booking/hold', async ({ eventId, bookingItems }, { rejectWithValue }) => {
  try {
    const res = await api.post('/group-bookings/hold', { eventId, bookingItems })
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to hold booking' })
  }
})

export const releaseBooking = createAsyncThunk('booking/release', async ({ eventId, groupLockId, bookingItems }, { rejectWithValue }) => {
  try {
    await api.post('/group-bookings/release', { eventId, groupLockId, bookingItems })
    return groupLockId
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to release booking' })
  }
})

export const createGroupBooking = createAsyncThunk('booking/createGroup', async ({ eventId, bookingItems, groupLockId, addonItems, promoCode }, { rejectWithValue }) => {
  try {
    const res = await api.post('/group-bookings', {
      eventId,
      bookingItems,
      groupLockId,
      paymentStatus: 'pending',
      addonItems: addonItems || [],
      promoCode: promoCode || null,
    })
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to create group booking' })
  }
})

export const getGroupBooking = createAsyncThunk('booking/getGroup', async (groupBookingId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/group-bookings/${groupBookingId}`)
    return res.data
  } catch (e) {
    return rejectWithValue(e.response?.data || { message: 'Failed to fetch group booking' })
  }
})

const initialState = {
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
    // Select a seat (SEATED events)
    selectSeat: (state, action) => {
      const seatId = action.payload
      if (!state.selectedItems.includes(seatId)) {
        state.selectedItems.push(seatId)
      }
    },

    // Deselect a seat
    deselectSeat: (state, action) => {
      const seatId = action.payload
      state.selectedItems = state.selectedItems.filter(id => id !== seatId)
    },

    // Clear all selected seats
    clearSelectedSeats: (state) => {
      state.selectedItems = []
      state.groupLockId = null
    },

    // Set ticket quantity and category (GENERAL events)
    setTicketSelection: (state, action) => {
      const { quantity, category } = action.payload
      state.selectedItems = { quantity, category }
    },

    // Clear ticket selection
    clearTicketSelection: (state) => {
      state.selectedItems = []
      state.groupLockId = null
    },

    // Set event type
    setEventType: (state, action) => {
      state.eventType = action.payload
    },

    // Set total price
    setTotalPrice: (state, action) => {
      state.totalPrice = action.payload
    },

    // Reset booking state
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

    // Set an add-on quantity (0 = remove)
    setAddonItem: (state, action) => {
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

    // Set promo code input
    setPromoCode: (state, action) => {
      state.promoCode = action.payload
    },

    // Set promo validation result
    setPromoValidation: (state, action) => {
      state.promoValidation = action.payload
      if (!action.payload || !action.payload.valid) {
        state.discountAmount = 0
      }
    },

    // Compute discount from ticket subtotal
    applyDiscount: (state, action) => {
      const { ticketSubtotal } = action.payload
      const promo = state.promoValidation
      if (!promo || !promo.valid) { state.discountAmount = 0; return }
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
        state.groupLockId = action.payload.groupLockId
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
        state.error = action.payload?.message || 'Failed to release booking'
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