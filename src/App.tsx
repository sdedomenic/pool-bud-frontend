import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '@api/useAuth'
import Logo from '@components/Logo'
import React from 'react'
import UserMenu from '@components/UserMenu'

export default function App() {
  const { user, profile } = useAuth()

  return (
    <div>
      <nav className="nav">
        <Logo />
        <div className="nav__links">
          <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/app/customers" className={({ isActive }) => (isActive ? 'active' : '')}>
            Customers
          </NavLink>
          <NavLink to="/app/inventory" className={({ isActive }) => (isActive ? 'active' : '')}>
            Inventory
          </NavLink>
          <NavLink to="/app/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            Settings
          </NavLink>
          {profile?.role === 'platform_admin' && (
            <NavLink to="/staff/setup" className={({ isActive }) => (isActive ? 'active' : '')}>
              Staff Tools
            </NavLink>
          )}
        </div>
        <div className="nav__actions">
          {user ? <UserMenu /> : <NavLink to="/login" className="btn secondary">Login</NavLink>}
        </div>
      </nav>
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
