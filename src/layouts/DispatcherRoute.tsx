import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@api/useAuth'

const allowedRoles = new Set(['dispatcher', 'admin', 'owner', 'platform_admin'])

export default function DispatcherRoute() {
  const { ready, user, profile, profileLoading, signOut } = useAuth()

  if (!ready || profileLoading) {
    return <div className="container">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <div className="container">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Account setup incomplete</h3>
          <p>
            We couldn&apos;t find a role for your account yet. Ask an owner or admin to add you,
            or contact support if you believe this is a mistake.
          </p>
          <div className="spacer" />
          <button className="btn secondary" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </div>
    )
  }

  if (!allowedRoles.has(profile.role)) {
    return (
      <div className="container">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>No access</h3>
          <p>Your role doesn&apos;t grant access to the dispatcher dashboard.</p>
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
