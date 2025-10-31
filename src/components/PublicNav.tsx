import { NavLink, Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@api/useAuth"
import Logo from "@components/Logo"

export default function PublicNav() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const routes = [
    { label: "Features", path: "/features" },
    { label: "Services", path: "/services" },
    { label: "Pricing", path: "/pricing" },
    { label: "About", path: "/about" },
  ]

  const currentRoute =
    routes.find((route) => location.pathname.startsWith(route.path))?.path ?? ""
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

      <label className="nav__mobile-select">
        <span className="sr-only">Navigate to</span>
        <select
          value={currentRoute}
          onChange={(event) => {
            const next = event.target.value
            if (!next) return
            navigate(next)
          }}
        >
          <option value="">Go to…</option>
          {routes.map((route) => (
            <option key={route.path} value={route.path}>
              {route.label}
            </option>
          ))}
        </select>
      </label>

      <div className="nav__actions nav__actions--public">
        {!user ? (
          <Link to="/login" className="btn" target="_blank" rel="noopener noreferrer">
            Login
          </Link>
        ) : (
          <Link to="/app" className="btn">Go to Dashboard</Link>
        )}
      </div>
    </header>
  )
}
