import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function About(){
  return (
    <div>
      <PublicNav />
      <section className="container section">
        <h1>About The Pool Bud</h1>
        <p className="muted" style={{maxWidth:780}}>
          We’re a small team of service-industry operators and engineers building practical software
          for pool companies. Our focus: speed in the field, clarity for customers, and reliable ops.
        </p>
        <div className="grid cols-2">
          <div className="card p16">
            <h3>Our principles</h3>
            <ul className="muted">
              <li>Simple beats complex</li>
              <li>Tech-first UX, mobile-friendly</li>
              <li>Your data, your control</li>
            </ul>
          </div>
          <div className="card p16">
            <h3>What’s next</h3>
            <ul className="muted">
              <li>Technician mobile mode</li>
              <li>Device integrations (BLE water testers)</li>
              <li>Deeper reporting</li>
            </ul>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
