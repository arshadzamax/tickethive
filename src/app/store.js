import { configureStore } from '@reduxjs/toolkit'
import seatsReducer from '../features/seats/seatSlice.js'
import bookingReducer from '../features/booking/bookingSlice.js'
import authReducer from '../features/auth/authSlice.js'
import adminReducer from '../features/admin/adminSlice.js'
import eventsReducer from '../features/events/eventSlice.js'
import venuesReducer from '../features/venues/venueSlice.js'

export default function createAppStore() {
  return configureStore({
    reducer: {
      seats: seatsReducer,
      booking: bookingReducer,
      auth: authReducer,
      admin: adminReducer,
      events: eventsReducer,
      venues: venuesReducer
    },
    middleware: (getDefault) => getDefault()
  })
}
