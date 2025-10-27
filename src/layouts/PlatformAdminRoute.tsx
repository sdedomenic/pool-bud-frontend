import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@api/useAuth'

export default function PlatformAdminRoute() {
  const { ready, user, profile, profileLoading, signOut } = useAuth()

  if (!ready || profileLoading) {
    return <div className="container">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'platform_admin') {
    return (
      <div className="container">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Restricted area</h3>
          <p>Only Pool Bud platform administrators can access this section.</p>
          <div className="spacer" />
          <button className="btn secondary" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
