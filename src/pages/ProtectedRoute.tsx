import React from 'react'
import { useAuth } from '@api/useAuth'
import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute(){
  const { ready, user } = useAuth()
  if (!ready) return <div className="container">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
