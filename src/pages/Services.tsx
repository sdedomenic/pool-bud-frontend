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

  const playbook = [
    {
      step: "1. Intake",
      detail: "Log new leads, capture pool details, and assign the right offering with one click.",
    },
    {
      step: "2. Plan",
      detail: "Auto-build task lists, estimate labor, and slot work onto the route that makes the most sense.",
    },
    {
      step: "3. Deliver",
      detail: "Guide techs through every visit with photos, chemistry, and notes captured in order.",
    },
    {
      step: "4. Follow-up",
      detail: "Share summaries, collect payments, and request reviews automatically.",
    },
  ]

  const serviceImage = {
    src: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
    alt: "Pool service technician brushing pool tile during maintenance visit.",
  }

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

      <section className="section container">
        <div className="service-feature">
          <div className="service-feature__media">
            <img src={serviceImage.src} alt={serviceImage.alt} loading="lazy" />
          </div>
          <div className="service-feature__content">
            <h2>Build a playbook your team can follow</h2>
            <p className="muted">
              Standardize how work gets done with checklists, timers, and proof-of-service prompts that adapt to the kind of visit you’re running.
            </p>
            <ul className="service-playbook">
              {playbook.map((item, index) => (
                <li key={index}>
                  <strong>{item.step}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>Specialized programs</h2>
        <div className="grid cols-3">
          {[
            { title: "Vacation rental care", copy: "Automate turnovers with photo proof and owner notifications." },
            { title: "HOA & communities", copy: "Track compliance logs, pH balance, and board communication." },
            { title: "Luxury pools", copy: "Document curated finishes and high-end equipment for meticulous clients." },
          ].map((card, index) => (
            <article key={index} className="card p16">
              <h3>{card.title}</h3>
              <p className="muted">{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
