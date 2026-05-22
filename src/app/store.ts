import { configureStore } from '@reduxjs/toolkit'
import type { AuthState, AdminState, EventsState, VenuesState, SeatsState, BookingState } from '../types'
import seatsReducer from '../features/seats/seatSlice'
import bookingReducer from '../features/booking/bookingSlice'
import authReducer from '../features/auth/authSlice'
import adminReducer from '../features/admin/adminSlice'
import eventsReducer from '../features/events/eventSlice'
import venuesReducer from '../features/venues/venueSlice'

export const store = configureStore({
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

export type RootState = {
  seats: SeatsState
  booking: BookingState
  auth: AuthState
  admin: AdminState
  events: EventsState
  venues: VenuesState
}

export type AppDispatch = typeof store.dispatch

export default store
