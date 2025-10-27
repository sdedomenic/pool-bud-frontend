import { Link } from "react-router-dom"
import PublicNav from "@components/PublicNav"
import PublicFooter from "@components/PublicFooter"

export default function Pricing(){
  const plans = [
    {name:"Starter", price:"$29", blurb:"Solo operator", features:["1 user","Jobs & photos","Customer portal"], cta:"Start trial"},
    {name:"Team", price:"$99", blurb:"Growing crews", features:["Up to 8 users","Routes & reporting","Stripe payments"], cta:"Choose Team", highlight:true},
    {name:"Business", price:"$199", blurb:"Multi-location", features:["Unlimited users","Advanced roles","Priority support"], cta:"Contact sales"},
  ]
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
      <PublicFooter />
    </div>
  )
}
