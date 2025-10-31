import React from "react"
import { NavLink, Link, useLocation } from "react-router-dom"
import { useAuth } from "@api/useAuth"
import Logo from "@components/Logo"

export default function PublicNav() {
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const routes = [
    { label: "Features", path: "/features" },
    { label: "Services", path: "/services" },
    { label: "Pricing", path: "/pricing" },
    { label: "About", path: "/about" },
  ]

  React.useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="nav nav--public">
      <Link to="/" className="brand">
        <Logo />
      </Link>

      <nav className="nav__links nav__links--public">
        {routes.map((route) => (
          <NavLink key={route.path} to={route.path}>
            {route.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="nav__menu-toggle"
        aria-label="Open navigation menu"
        onClick={() => setMenuOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="nav__actions nav__actions--public">
        {!user ? (
          <Link to="/login" className="btn" target="_blank" rel="noopener noreferrer">
            Login
          </Link>
        ) : (
          <Link to="/app" className="btn">
            Go to Dashboard
          </Link>
        )}
      </div>

      <aside className={`nav-drawer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="nav-drawer__header">
          <Logo />
          <button
            type="button"
            className="nav-drawer__close"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="nav-drawer__links">
          {routes.map((route) => (
            <NavLink key={route.path} to={route.path}>
              {route.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-drawer__cta">
          {!user ? (
            <Link to="/login" className="btn">
              Login
            </Link>
          ) : (
            <Link to="/app" className="btn">
              Go to Dashboard
            </Link>
          )}
        </div>
      </aside>
      {menuOpen && <div className="nav-drawer__overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  )
}
