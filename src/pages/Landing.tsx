import { Link } from "react-router-dom"
import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function Landing(){
  const operations = [
    {
      title: "Technician first mobile app",
      copy:
        "Give every field tech a clean checklist, offline photo capture, and instant chemical logging so they can focus on the water in front of them.",
    },
    {
      title: "Real-time visibility for the office",
      copy:
        "Monitor routes, approve change orders, and keep customers informed from a single dispatch board that updates the moment work is complete.",
    },
    {
      title: "Customer trust on autopilot",
      copy:
        "Automated visit summaries and galleries show owners the service they’re paying for, while branded invoices and payments close the loop.",
    },
  ]

  const gallery = [
    {
      src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
      caption: "Crystal-clear residential pool after a weekly service visit.",
    },
    {
      src: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=800&q=80",
      caption: "Commercial lap pool with automated chemistry monitoring.",
    },
    {
      src: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
      caption: "Resort-style pool prepared for a weekend opening.",
    },
  ]

  const testimonials = [
    {
      quote:
        "The Pool Bud keeps our technicians organized and gives our customers a reason to stick with us. Photos land in their inbox before the truck leaves the driveway.",
      author: "Morgan B., BlueWave Pools",
    },
    {
      quote:
        "We went from phone calls and clipboards to a single dashboard. Billing time dropped by 50% because everything is in one place.",
      author: "Luis H., AquaCare Services",
    },
  ]

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

      {/* Operations */}
      <section className="container section">
        <h2>Everything your crews need in the field</h2>
        <div className="grid cols-3">
          {operations.map((item, index) => (
            <article key={index} className="card p16">
              <h3>{item.title}</h3>
              <p className="muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonial-strip">
        <div className="container">
          <h2 className="testimonial-heading">Trusted by forward-thinking pool pros</h2>
          <div className="testimonial-grid">
            {testimonials.map((item, index) => (
              <blockquote key={index} className="testimonial-card">
                <p>“{item.quote}”</p>
                <footer>{item.author}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="container section">
        <h2>See the difference</h2>
        <p className="muted" style={{ maxWidth: 720 }}>
          Show customers sparkling results with a built-in gallery. Drag-and-drop photos from the field and let The Pool Bud package the story for you.
        </p>
        <div className="gallery-grid">
          {gallery.map((image, index) => (
            <figure key={index} className="gallery-card">
              <img src={image.src} alt={image.caption} loading="lazy" />
              <figcaption className="muted">{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
