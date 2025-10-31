import { Link } from "react-router-dom"
import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function Features(){
  const automation = [
    {
      title: "Smart automations",
      copy:
        "Trigger customer alerts the moment a technician marks a visit complete. Send before/after photos, chemistry results, and invoices automatically.",
    },
    {
      title: "Template your workflows",
      copy:
        "Build service templates for openings, weekly maintenance, and repairs so every team member captures the same data and checks the same boxes.",
    },
    {
      title: "Integrate your toolkit",
      copy:
        "Connect Stripe, Supabase, and popular accounting tools to keep billing in sync while the Pool Bud handles day-to-day field operations.",
    },
  ]

  const featureImages = [
    {
      src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      alt: "Technician testing pool water chemistry on-site.",
      caption: "Log chemistry in seconds with structured fields tailored to pool care.",
    },
    {
      src: "https://images.unsplash.com/photo-1542718618-2806d1b84272?auto=format&fit=crop&w=800&q=80",
      alt: "Team collaborating over pool maintenance schedule.",
      caption: "Coordinate routes and assignments with a drag-and-drop scheduler.",
    },
  ]

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

      <section className="section container">
        <h2>Automate the way you communicate</h2>
        <div className="grid cols-3">
          {automation.map((item, index) => (
            <article key={index} className="card p16">
              <h3>{item.title}</h3>
              <p className="muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container section">
        <h2>Designed for teams who live in the field</h2>
        <p className="muted" style={{ maxWidth: 720 }}>
          From dispatch to doorstep, The Pool Bud keeps everyone aligned. Capture photos, note repairs, and sync inventory as you move through each visit.
        </p>
        <div className="gallery-grid">
          {featureImages.map((image, index) => (
            <figure key={index} className="gallery-card">
              <img src={image.src} alt={image.alt} loading="lazy" />
              <figcaption className="muted">{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
