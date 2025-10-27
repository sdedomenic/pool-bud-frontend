
import { useQuery } from '@tanstack/react-query'
import { listJobs } from '@api/repo'
import JobCard from '@components/JobCard'
import { useAuth } from '@api/useAuth'
import OwnerDashboard from './OwnerDashboard'
import AdminDashboard from './AdminDashboard'
import DispatcherDashboard from './DispatcherDashboard'
import TechDashboard from './TechDashboard'

export default function Dashboard(){
  const { profile, profileLoading } = useAuth()

  if (profileLoading && !profile) {
    return <div className="card">Loading dashboard…</div>
  }

  if (profile?.role === 'owner') {
    return <OwnerDashboard />
  }

  if (profile?.role === 'admin') {
    return <AdminDashboard />
  }

  if (profile?.role === 'dispatcher') {
    return <DispatcherDashboard />
  }

  if (profile?.role === 'tech') {
    return <TechDashboard />
  }

  const { data: jobs } = useQuery({ queryKey:['jobs'], queryFn: listJobs })
  return (
    <div>
      <h2 style={{marginTop:0}}>Today’s Jobs</h2>
      <div className="grid">
        {jobs?.map(j => <JobCard key={j.id} job={j} />)}
      </div>
    </div>
  )
}
