import { Link } from "react-router-dom"
import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function Landing(){
  return (
    <div>
      <PublicNav />

      {/* Hero */}
      <section className="hero-wrap">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Run your pool business with confidence.</h1>
            <p className="muted">
              Scheduling, field logging, photos, chemicals, and payments — streamlined for busy crews.
            </p>
            <div className="cta-row">
              <Link to="/login" className="btn">Get started</Link>
              <Link to="/features" className="btn secondary">See features</Link>
            </div>
            <div className="logo-row">
              <span className="tag">Stripe-ready</span>
              <span className="tag">Built on Supabase</span>
              <span className="tag">Mobile-friendly</span>
            </div>
          </div>
          <div className="hero-card card">
            <div className="snapshot-title">Today’s Snapshot</div>
            <ul className="hero-stats">
              <li><strong>12</strong> jobs scheduled</li>
              <li><strong>7</strong> completed</li>
              <li><strong>5</strong> invoices due</li>
            </ul>
            <div className="muted tiny">Demo data for illustration</div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container section">
        <div className="grid cols-3">
          {[
            {t:"Plan better routes", d:"Drag-and-drop schedule with time windows and priorities."},
            {t:"Finish jobs faster", d:"Photos + chemical tests in one screen designed for techs."},
            {t:"Delight customers", d:"Share proof of work and collect payments in a click."},
          ].map((x,i)=>(
            <div key={i} className="card" style={{padding:18}}>
              <div style={{fontWeight:700, marginBottom:6}}>{x.t}</div>
              <div className="muted">{x.d}</div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
