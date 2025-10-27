
import React from 'react'
import { searchInventory } from '@api/repo'

export default function Inventory(){
  const [q, setQ] = React.useState('chlorine')
  const [items, setItems] = React.useState<any[]>([])
  React.useEffect(()=>{ searchInventory('chlorine').then(setItems) }, [])
  const onSearch = ()=> searchInventory(q).then(setItems)
  return (
    <div className="card">
      <h3 style={{marginTop:0}}>Store Inventory</h3>
      <div style={{display:'flex', gap:8}}>
        <input className="input" placeholder="Search parts/chemicals…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={onSearch}>Search</button>
      </div>
      <div className="spacer"></div>
      <div className="grid">
        {items.map(it=>(
          <div key={it.id} className="card" style={{padding:12}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700}}>{it.name}</div>
                <div className="tag">SKU {it.sku}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div>${Number(it.price_cents/100).toFixed(2)}</div>
                <div style={{fontSize:12, color:'#a6c4e6'}}>{it.qty} in stock</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
