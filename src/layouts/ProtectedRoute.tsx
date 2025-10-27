import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@api/useAuth'

export default function ProtectedRoute() {
  const { ready, user, profile, profileLoading } = useAuth()
  const location = useLocation()

  // Wait until auth finishes checking session
  if (!ready || profileLoading) return <div className="container">Loading…</div>

  // If not logged in, go to login page
  if (!user) return <Navigate to="/login" replace />

  const pathname = location.pathname

  if (profile && !profile.has_completed_setup && pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />
  }

  if (profile?.has_completed_setup && pathname === '/welcome') {
    return <Navigate to="/app" replace />
  }

  // Otherwise render child routes
  return <Outlet />
}
