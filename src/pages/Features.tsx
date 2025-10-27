import { Link } from "react-router-dom"
import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function Features(){
  return (
    <div>
      <PublicNav />
      <section className="container section">
        <h1>Features built for field service</h1>
        <p className="muted">The essentials you need — nothing you don’t.</p>
        <div className="grid cols-2">
          <div className="card p16">
            <h3>Scheduling & Routes</h3>
            <ul>
              <li>Drag-and-drop daily plan</li>
              <li>Time windows & job notes</li>
              <li>Technician assignment</li>
            </ul>
          </div>
          <div className="card p16">
            <h3>Field Logging</h3>
            <ul>
              <li>Before/after photos</li>
              <li>Chemical test logs (pH, Chlorine, Alkalinity)</li>
              <li>Service checklist</li>
            </ul>
          </div>
          <div className="card p16">
            <h3>Customer Experience</h3>
            <ul>
              <li>Self-serve portal</li>
              <li>Visit history & photos</li>
              <li>Easy approvals</li>
            </ul>
          </div>
          <div className="card p16">
            <h3>Payments & Reporting</h3>
            <ul>
              <li>Stripe checkout & receipts</li>
              <li>Outstanding balances</li>
              <li>Daily rollups</li>
            </ul>
          </div>
        </div>
        <div className="cta-center">
          <Link to="/login" className="btn">Try it</Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
