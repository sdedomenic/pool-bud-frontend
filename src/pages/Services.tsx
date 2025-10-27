import { Link } from "react-router-dom"
import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function Services(){
  const items = [
    {t:"Weekly Maintenance", d:"Routes, chemistry checks, photo proof."},
    {t:"Opening / Closing", d:"Seasonal packages with templated checklists."},
    {t:"Repairs", d:"Track labor, parts, and customer approvals."},
    {t:"Commercial Service", d:"Multi-site reporting and compliance logs."},
    {t:"Inventory", d:"Parts & chemicals reference with stock levels."},
    {t:"Customer Portal", d:"Status, photos, invoices — all in one link."},
  ]
  return (
    <div>
      <PublicNav />
      <section className="container section">
        <h1>Services we power</h1>
        <p className="muted">Configure offerings and standardize your workflows.</p>
        <div className="grid cols-3">
          {items.map((x,i)=>(
            <div key={i} className="card" style={{padding:18}}>
              <div style={{fontWeight:700, marginBottom:6}}>{x.t}</div>
              <div className="muted">{x.d}</div>
            </div>
          ))}
        </div>
        <div className="cta-center">
          <Link to="/pricing" className="btn">See pricing</Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
