import { NavLink, Link } from "react-router-dom"
import { useAuth } from "@api/useAuth"
import Logo from "@components/Logo"

export default function PublicNav() {
  const { user } = useAuth()
  return (
    <header className="nav">
      <Link to="/" className="brand">
        <Logo />
      </Link>

      <nav className="public-links">
        <NavLink to="/features">Features</NavLink>
        <NavLink to="/services">Services</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>

      <div style={{marginLeft:"auto", display:"flex", gap:8}}>
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
