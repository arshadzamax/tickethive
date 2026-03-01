import { configureStore } from '@reduxjs/toolkit'
import seatsReducer from '../features/seats/seatSlice.js'
import bookingReducer from '../features/booking/bookingSlice.js'
import authReducer from '../features/auth/authSlice.js'
import adminReducer from '../features/admin/adminSlice.js'

export default function createAppStore() {
  return configureStore({
    reducer: {
      seats: seatsReducer,
      booking: bookingReducer,
      auth: authReducer,
      admin: adminReducer
    },
    middleware: (getDefault) => getDefault()
  })
}
