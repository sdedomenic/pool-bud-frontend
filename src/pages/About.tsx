import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function About(){
  const milestones = [
    { year: "2022", detail: "Launched The Pool Bud private beta with three independent service companies." },
    { year: "2023", detail: "Introduced customer portals, technician photo capture, and automated chemistry logs." },
    { year: "2024", detail: "Expanded to commercial properties with compliance reporting and multi-location dashboards." },
  ]

  const teamImage = {
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    alt: "Pool Bud team collaborating around a laptop reviewing service schedules.",
  }

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

      <section className="container section">
        <div className="about-feature">
          <div className="about-feature__image">
            <img src={teamImage.src} alt={teamImage.alt} loading="lazy" />
          </div>
          <div className="about-feature__copy">
            <h2>Operators building for operators</h2>
            <p className="muted">
              We started The Pool Bud after running service routes ourselves and bumping into the same problems week after week—paper checklists, lost photos, and long nights billing. Today we partner with companies across North America to front-load clarity into every visit.
            </p>
            <ul className="milestones">
              {milestones.map((milestone, index) => (
                <li key={index}>
                  <strong>{milestone.year}</strong>
                  <span>{milestone.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
