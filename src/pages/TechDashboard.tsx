import React from 'react'
import { useAuth } from '@api/useAuth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listTechnicianJobs,
  addChemicalReading,
  completeJob,
} from '@api/repo'
import type { Job } from '@api/types'
import StatsCard from '@components/StatsCard'
import { Link } from 'react-router-dom'

function formatDate(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isToday(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isThisWeek(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  return date >= startOfWeek
}

type ChemState = {
  jobId: string | null
  pH: string
  chlorine: string
  alkalinity: string
}

const initialChemState: ChemState = {
  jobId: null,
  pH: '',
  chlorine: '',
  alkalinity: '',
}

export default function TechDashboard() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const profileId = profile?.id

  const [chemState, setChemState] = React.useState(initialChemState)
  const [chemStatus, setChemStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [chemError, setChemError] = React.useState<string | null>(null)

  const jobsQuery = useQuery({
    queryKey: ['tech-jobs', profileId],
    queryFn: () => listTechnicianJobs(profileId!),
    enabled: !!profileId,
  })

  const completeMutation = useMutation({
    mutationFn: (jobId: string) => completeJob(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tech-jobs', profileId] })
    },
  })

  const chemMutation = useMutation({
    mutationFn: ({ jobId, readings }: { jobId: string; readings: { pH: string; chlorine: string; alkalinity: string } }) =>
      addChemicalReading(jobId, readings),
    onSuccess: () => {
      setChemState(initialChemState)
      setChemStatus('success')
      setChemError(null)
      qc.invalidateQueries({ queryKey: ['tech-jobs', profileId] })
    },
    onError: (err) => {
      setChemStatus('error')
      setChemError(err instanceof Error ? err.message : 'Unable to save reading.')
    },
  })

  if (!profileId) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Technician dashboard</h2>
        <p>Your account isn&apos;t linked to a technician profile yet. Contact your admin.</p>
      </div>
    )
  }

  const jobs = jobsQuery.data ?? []
  const upcoming = jobs.filter((job) => !job.completed_at)
  const completed = jobs.filter((job) => !!job.completed_at)

  const todayJobs = upcoming.filter((job) => isToday(job.scheduled_at))
  const completedThisWeek = completed.filter((job) => job.completed_at && isThisWeek(job.completed_at))

  const urgentJobs = upcoming.filter((job) => new Date(job.scheduled_at) < new Date())

  const nextJobs = [...upcoming].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const handleComplete = (jobId: string) => {
    completeMutation.mutate(jobId)
  }

  const handleOpenChem = (job: Job) => {
    setChemState({ jobId: job.id, pH: '', chlorine: '', alkalinity: '' })
    setChemStatus('idle')
    setChemError(null)
  }

  const handleChemSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!chemState.jobId) return
    if (!chemState.pH || !chemState.chlorine || !chemState.alkalinity) {
      setChemError('Fill in all readings before submitting.')
      setChemStatus('error')
      return
    }
    setChemStatus('submitting')
    chemMutation.mutate({
      jobId: chemState.jobId,
      readings: {
        pH: chemState.pH,
        chlorine: chemState.chlorine,
        alkalinity: chemState.alkalinity,
      },
    })
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Technician dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        View assigned jobs, log chemistry, and keep your route on track.
      </p>

      <div className="stats-grid">
        <StatsCard
          title="Jobs today"
          value={todayJobs.length.toString()}
          detail={urgentJobs.length ? `${urgentJobs.length} overdue` : 'All on schedule'}
          tone={urgentJobs.length ? 'danger' : 'default'}
        />
        <StatsCard
          title="Upcoming jobs"
          value={upcoming.length.toString()}
          detail={`Next: ${nextJobs[0] ? nextJobs[0].customer_name : 'None'}`}
        />
        <StatsCard
          title="Completed this week"
          value={completedThisWeek.length.toString()}
          detail="Great work!"
          tone="success"
        />
      </div>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Upcoming route</h2>
        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No assigned jobs right now.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Scheduled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {nextJobs.map((job) => {
                const isOverdue = new Date(job.scheduled_at) < new Date()
                const isTodayJob = isToday(job.scheduled_at)
                return (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.address}</div>
                    </td>
                    <td>
                      <div>{formatDate(job.scheduled_at)}</div>
                      <div style={{ color: isOverdue ? 'var(--danger)' : isTodayJob ? 'var(--primary)' : 'var(--muted)', fontSize: 13 }}>
                        {isOverdue ? 'Overdue' : isTodayJob ? 'Today' : 'Upcoming'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link className="btn secondary" to={`/app/jobs/${job.id}`}>
                          View details
                        </Link>
                        <button
                          className="btn secondary"
                          type="button"
                          onClick={() => handleOpenChem(job)}
                        >
                          Log chemistry
                        </button>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => handleComplete(job.id)}
                          disabled={completeMutation.isPending}
                        >
                          {completeMutation.isPending ? 'Marking…' : 'Mark complete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Log chemistry</h2>
        {!chemState.jobId ? (
          <p style={{ color: 'var(--muted)' }}>Select “Log chemistry” on a job above to record readings.</p>
        ) : (
          <form onSubmit={handleChemSubmit} className="form-grid" style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 600 }}>
              Job: {jobs.find((job) => job.id === chemState.jobId)?.customer_name ?? chemState.jobId}
            </div>
            <label>pH</label>
            <input
              className="input"
              value={chemState.pH}
              onChange={(event) => setChemState((prev) => ({ ...prev, pH: event.target.value }))}
              required
            />
            <label>Chlorine (ppm)</label>
            <input
              className="input"
              value={chemState.chlorine}
              onChange={(event) => setChemState((prev) => ({ ...prev, chlorine: event.target.value }))}
              required
            />
            <label>Alkalinity</label>
            <input
              className="input"
              value={chemState.alkalinity}
              onChange={(event) => setChemState((prev) => ({ ...prev, alkalinity: event.target.value }))}
              required
            />
            {chemStatus === 'error' && <div style={{ color: 'var(--danger)' }}>{chemError}</div>}
            {chemStatus === 'success' && <div style={{ color: 'var(--success)' }}>Readings saved.</div>}
            <button className="btn" type="submit" disabled={chemMutation.isPending}>
              {chemMutation.isPending ? 'Saving…' : 'Save readings'}
            </button>
          </form>
        )}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Job history</h2>
        {completed.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No completed jobs yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Completed</th>
                <th>Chemistry entries</th>
              </tr>
            </thead>
            <tbody>
              {completed.slice(0, 10).map((job) => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.address}</div>
                  </td>
                  <td>{job.completed_at ? formatDate(job.completed_at) : '--'}</td>
                  <td>
                    {job.chem_logs && job.chem_logs.length > 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{job.chem_logs.length} readings logged</div>
                    ) : (
                      <div style={{ color: 'var(--danger)', fontSize: 13 }}>No readings</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
