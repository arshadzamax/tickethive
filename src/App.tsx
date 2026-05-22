import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Layout from './components/Layout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import LandingPage from './pages/LandingPage.tsx'
import EventsPage from './pages/EventsPage.tsx'
import BookingPage from './pages/BookingPage.tsx'
import BookingSuccessPage from './pages/BookingSuccessPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import AdminDashboard from './pages/AdminDashboard.tsx'
import CreateEventPage from './pages/CreateEventPage.tsx'
import CreateVenuePage from './pages/CreateVenuePage.tsx'
import { fetchCurrentUser, selectToken, selectAuthInitialized } from './features/auth/authSlice'

export default function App() {
  const dispatch = useDispatch()
  const token = useSelector(selectToken)
  const initialized = useSelector(selectAuthInitialized)

  useEffect(() => {
    if (token && !initialized) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, token, initialized])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route
        path="/events/create"
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/venues/create"
        element={
          <ProtectedRoute>
            <CreateVenuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/booking"
        element={
          <ProtectedRoute>
            <Layout><BookingPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout><ProfilePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking-success/:groupBookingId"
        element={
          <ProtectedRoute>
            <BookingSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      {/* Legacy redirects */}
      <Route path="/booking" element={<Navigate to="/events" replace />} />
      <Route path="/admin" element={<Navigate to="/events" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

