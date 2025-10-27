import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Logo from '@components/Logo'
import { useAuth } from '@api/useAuth'
import UserMenu from '@components/UserMenu'

export default function StaffShell() {
  const { user } = useAuth()

  return (
    <div>
      <nav className="nav">
        <Logo />
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
        <NavLink to="/staff/setup" className={({ isActive }) => (isActive ? 'active' : '')}>
          Company Setup
        </NavLink>
        <div style={{ flex: 1 }} />
        {user ? <UserMenu /> : <NavLink to="/login" className="btn secondary">Login</NavLink>}
      </nav>
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
