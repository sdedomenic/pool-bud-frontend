import { Link } from "react-router-dom"
import Logo from "@components/Logo"

export default function PublicFooter(){
  return (
    <footer className="footer container">
      <div className="footer-row">
        <div className="brand">
          <Logo size="small" />
        </div>
        <div className="footer-links">
          <Link to="/features">Features</Link>
          <Link to="/services">Services</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/about">About</Link>
        </div>
        <div className="footer-meta">© {new Date().getFullYear()} The Pool Bud</div>
      </div>
    </footer>
  )
}
