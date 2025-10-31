import { Link } from "react-router-dom"
import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function Pricing(){
  const plans = [
    {name:"Starter", price:"$29", blurb:"Solo operator", features:["1 user","Jobs & photos","Customer portal"], cta:"Start trial"},
    {name:"Team", price:"$99", blurb:"Growing crews", features:["Up to 8 users","Routes & reporting","Stripe payments"], cta:"Choose Team", highlight:true},
    {name:"Business", price:"$199", blurb:"Multi-location", features:["Unlimited users","Advanced roles","Priority support"], cta:"Contact sales"},
  ]

  const faqs = [
    {
      q: "Do I need to sign a long-term contract?",
      a: "No. Plans are billed month-to-month. Upgrade, downgrade, or cancel whenever you’d like.",
    },
    {
      q: "Is there a setup fee?",
      a: "Setup is free. Our onboarding team will migrate your customers and help you build templates at no extra cost.",
    },
    {
      q: "Can I connect Stripe or my existing payment processor?",
      a: "Yes. The Pool Bud integrates with Stripe out of the box. We can also help you bridge into your preferred tools through our API.",
    },
    {
      q: "Do you support larger teams?",
      a: "Absolutely. The Business plan scales to unlimited users and includes a dedicated success manager.",
    },
  ]

  const pricingImage = {
    src: "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=900&q=80",
    alt: "Evening view of a resort-style swimming pool maintained to perfection.",
  }

  return (
    <div>
      <PublicNav />
      <section className="container section">
        <h1>Simple pricing</h1>
        <p className="muted">All plans include core scheduling, field logging, and customer portal.</p>
        <div className="grid cols-3">
          {plans.map((p,i)=>(
            <div key={i} className="card pricing" style={{padding:18, borderColor: p.highlight ? "#93c5fd" : "var(--border)"}}>
              <div className="muted">{p.blurb}</div>
              <div className="price"><span>{p.price}</span><small>/mo</small></div>
              <div style={{fontWeight:700, marginBottom:8}}>{p.name}</div>
              <ul className="muted">{p.features.map((f,j)=>(<li key={j}>{f}</li>))}</ul>
              <div className="spacer"></div>
              <Link to="/login" className="btn" style={{width:"100%", textAlign:"center"}}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="pricing-highlight">
          <div className="pricing-highlight__media">
            <img src={pricingImage.src} alt={pricingImage.alt} loading="lazy" />
          </div>
          <div className="pricing-highlight__copy">
            <h2>Grow without worrying about admin work</h2>
            <p className="muted">
              From the first pool you service to your hundredth account, The Pool Bud follows your pace. Add new technicians, open another branch, or launch specialty services—pricing adjusts as you expand.
            </p>
            <ul className="pricing-highlight__list">
              <li>Unlimited customer records with every plan</li>
              <li>Role-based access so the right people see the right data</li>
              <li>Automatic scaling for storage, photos, and chemistry logs</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>Pricing FAQs</h2>
        <div className="faq-grid">
          {faqs.map((item, index) => (
            <article key={index} className="faq-card">
              <h3>{item.q}</h3>
              <p className="muted">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
