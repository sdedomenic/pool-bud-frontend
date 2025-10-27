
export default function Settings(){
  return (
    <div className="card">
      <h3 style={{marginTop:0}}>Company Settings</h3>
      <div className="grid cols-2">
        <div>
          <label>Company Name</label>
          <input className="input" placeholder="Pool Pros, LLC"/>
        </div>
        <div>
          <label>Default Service Window</label>
          <select className="input">
            <option>Morning (8–12)</option>
            <option>Afternoon (12–4)</option>
            <option>Flexible</option>
          </select>
        </div>
        <div>
          <label>Stripe Publishable Key</label>
          <input className="input" placeholder="pk_live_..." />
        </div>
        <div>
          <label>Customer Portal URL</label>
          <input className="input" placeholder="https://portal.poolbud.com/yourco" />
        </div>
      </div>
    </div>
  )
}
