
import { Link } from 'react-router-dom'
import type { Job } from '@api/types'

export default function JobCard({job}:{job: Job}){
  return (
    <div className="card">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div>
          <h3 style={{margin:'0 0 4px 0'}}>{job.customer_name}</h3>
          <div className="tag">{job.address}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:12, color:'#a6c4e6'}}>{new Date(job.scheduled_at).toLocaleString()}</div>
          <div className="spacer"></div>
          <Link className="btn" to={`/jobs/${job.id}`}>Open</Link>
        </div>
      </div>
    </div>
  )
}
