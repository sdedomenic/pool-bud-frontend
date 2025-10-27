
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getJob, completeJob, uploadPhoto, addChemicalReading } from '@api/repo'
import PhotoUploader from '@components/PhotoUploader'
import React from 'react'

export default function JobDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  const { data: job } = useQuery({ queryKey:['job', id], queryFn: ()=>getJob(id!), enabled: !!id })
  const complete = useMutation({ mutationFn: ()=>completeJob(id!), onSuccess: ()=>{ qc.invalidateQueries({queryKey:['jobs']}); nav('/') } })
  const addBefore = useMutation({ mutationFn: (f: File)=>uploadPhoto(id!, 'before', f), onSuccess: ()=> qc.invalidateQueries({queryKey:['job', id]}) })
  const addAfter  = useMutation({ mutationFn: (f: File)=>uploadPhoto(id!, 'after', f), onSuccess: ()=> qc.invalidateQueries({queryKey:['job', id]}) })
  const addChem   = useMutation({ mutationFn: (p: any)=>addChemicalReading(id!, p), onSuccess: ()=> qc.invalidateQueries({queryKey:['job', id]}) })

  const [chem, setChem] = React.useState({ pH:'', chlorine:'', alkalinity:'' })

  if(!job) return <div>Loading…</div>
  const chemLogs = Array.isArray(job.chem_logs) ? job.chem_logs : []
  return (
    <div className="grid cols-2">
      <div className="card">
        <h3 style={{marginTop:0}}>Service Checklist</h3>
        <ul>
          <li>Vacuum pool</li>
          <li>Skim surface & empty baskets</li>
          <li>Brush walls</li>
          <li>Test & balance chemicals</li>
        </ul>
        <div className="spacer"></div>
        <button className="btn" onClick={()=>complete.mutate()}>Mark Complete</button>
      </div>
      <div className="grid">
        <div className="card">
          <h3 style={{marginTop:0}}>Before / After Photos</h3>
          <div className="grid cols-2">
            <div>
              <PhotoUploader label="Before photo" onChange={(f)=>addBefore.mutate(f)} />
              {job.before_url && <img src={job.before_url} style={{marginTop:8, maxWidth:'100%', borderRadius:12}}/>}
            </div>
            <div>
              <PhotoUploader label="After photo" onChange={(f)=>addAfter.mutate(f)} />
              {job.after_url && <img src={job.after_url} style={{marginTop:8, maxWidth:'100%', borderRadius:12}}/>}
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{marginTop:0}}>Chemical Test</h3>
          <div className="grid cols-3">
            <div>
              <label>pH</label>
              <input className="input" value={chem.pH} onChange={e=>setChem({...chem, pH:e.target.value})}/>
            </div>
            <div>
              <label>Chlorine (ppm)</label>
              <input className="input" value={chem.chlorine} onChange={e=>setChem({...chem, chlorine:e.target.value})}/>
            </div>
            <div>
              <label>Alkalinity</label>
              <input className="input" value={chem.alkalinity} onChange={e=>setChem({...chem, alkalinity:e.target.value})}/>
            </div>
          </div>
          <div className="spacer"></div>
          <button className="btn" onClick={()=>addChem.mutate(chem)}>Save Reading</button>
          <div className="spacer"></div>
          {chemLogs.length > 0 && (
            <div>
              <div style={{fontWeight:700, marginBottom:6}}>Recent Logs</div>
              <ul>
                {chemLogs.map((c:any,i:number)=>(
                  <li key={i} style={{fontSize:14, color:'#a6c4e6'}}>
                    {new Date(c.taken_at).toLocaleString()}: pH {c.ph}, Cl {c.chlorine_ppm}, Alk {c.alkalinity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
