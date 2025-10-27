import React from 'react'
import { useAuth } from '@api/useAuth'
import {
  listCompanyJobs,
  listCompanyProfiles,
  listCompanyCustomers,
  updateJobAssignment,
  createJob,
  type ProfileSummary,
} from '@api/repo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import StatsCard from '@components/StatsCard'

const DATETIME_LOCAL_FORMAT = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatDisplayDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

function isToday(value: string) {
  const date = new Date(value)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

type AssignmentEdit = {
  technician_id: string
  scheduled_at: string
}

type JobFormState = {
  customer_name: string
  address: string
  scheduled_at: string
  technician_id: string
  customer_id: string
}

const initialJobForm: JobFormState = {
  customer_name: '',
  address: '',
  scheduled_at: '',
  technician_id: '',
  customer_id: '',
}

export default function DispatcherDashboard() {
  const { profile } = useAuth()
  const companyId = profile?.company_id
  const qc = useQueryClient()

  const [edits, setEdits] = React.useState<Record<string, AssignmentEdit>>({})
  const [jobForm, setJobForm] = React.useState<JobFormState>(initialJobForm)
  const [jobFormStatus, setJobFormStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [jobFormError, setJobFormError] = React.useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = React.useState('')

  const jobsQuery = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: () => listCompanyJobs(companyId!),
    enabled: !!companyId,
  })

  const profilesQuery = useQuery({
    queryKey: ['company-profiles', companyId],
    queryFn: () => listCompanyProfiles(companyId!),
    enabled: !!companyId,
  })

  const customersQuery = useQuery({
    queryKey: ['company-customers', companyId],
    queryFn: () => listCompanyCustomers(companyId!),
    enabled: !!companyId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: AssignmentEdit }) =>
      updateJobAssignment(jobId, {
        technician_id: payload.technician_id || null,
        scheduled_at: payload.scheduled_at ? new Date(payload.scheduled_at).toISOString() : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-jobs', companyId] })
    },
  })

  const createJobMutation = useMutation({
    mutationFn: async (payload: JobFormState) => {
      if (!companyId) throw new Error('No company context')
      if (!payload.customer_id) {
        throw new Error('Select a customer for this job.')
      }
      if (!payload.customer_name.trim() || !payload.address.trim() || !payload.scheduled_at) {
        throw new Error('Customer, address, and schedule are required.')
      }
      await createJob({
        company_id: companyId,
        customer_name: payload.customer_name.trim(),
        address: payload.address.trim(),
        scheduled_at: new Date(payload.scheduled_at).toISOString(),
        customer_id: payload.customer_id,
        technician_id: payload.technician_id || null,
      })
    },
    onSuccess: () => {
      setJobForm(initialJobForm)
      setJobFormStatus('success')
      setJobFormError(null)
      qc.invalidateQueries({ queryKey: ['company-jobs', companyId] })
    },
    onError: (err) => {
      setJobFormStatus('error')
      setJobFormError(err instanceof Error ? err.message : 'Unable to create job.')
    },
  })

  const technicians = React.useMemo(
    () => (profilesQuery.data ?? []).filter((member) => member.role === 'tech'),
    [profilesQuery.data]
  )

  const customers = React.useMemo(() => {
    const list = customersQuery.data ?? []
    if (!customerSearch.trim()) return list
    const q = customerSearch.trim().toLowerCase()
    return list.filter((customer) =>
      [customer.customer_name, customer.address, customer.email, customer.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    )
  }, [customersQuery.data, customerSearch])

  const jobs = jobsQuery.data ?? []
  const upcoming = jobs.filter((job) => !job.completed_at)
  const overdue = upcoming.filter((job) => new Date(job.scheduled_at) < new Date())
  const unassigned = upcoming.filter((job) => !job.technician_id)
  const todayJobs = upcoming.filter((job) => isToday(job.scheduled_at))

  const recentCreates = [...jobs]
    .sort((a, b) => new Date(b.created_at ?? b.scheduled_at).getTime() - new Date(a.created_at ?? a.scheduled_at).getTime())
    .slice(0, 10)

  const getEdit = (jobId: string): AssignmentEdit => {
    const existing = edits[jobId]
    if (existing) return existing
    const job = jobs.find((item) => item.id === jobId)
    return {
      technician_id: job?.technician_id ?? '',
      scheduled_at: job?.scheduled_at ? DATETIME_LOCAL_FORMAT(job.scheduled_at) : '',
    }
  }

  const handleEditChange = (jobId: string, field: keyof AssignmentEdit, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [jobId]: {
        ...getEdit(jobId),
        [field]: value,
      },
    }))
  }

  const handleSave = (jobId: string) => {
    const payload = getEdit(jobId)
    updateMutation.mutate({ jobId, payload })
  }

  const handleJobFormChange = (field: keyof JobFormState, value: string) => {
    setJobForm((prev) => ({ ...prev, [field]: value }))
    setJobFormStatus('idle')
    setJobFormError(null)
  }

  const handleCreateJob = (event: React.FormEvent) => {
    event.preventDefault()
    setJobFormStatus('saving')
    createJobMutation.mutate(jobForm)
  }

  if (!companyId) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Dispatcher dashboard</h2>
        <p>Your profile isn&apos;t tied to a company. Contact an owner for access.</p>
      </div>
    )
  }

  const applyCustomerToForm = (customerId: string) => {
    const customer = (customersQuery.data ?? []).find((item) => item.id === customerId)
    if (!customer) return
    setJobForm((prev) => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.customer_name,
      address: customer.address,
    }))
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dispatcher dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Manage today&apos;s schedule, assign technicians, and create new service visits for customers.
      </p>

      <div className="stats-grid">
        <StatsCard
          title="Unassigned jobs"
          value={unassigned.length.toString()}
          detail={overdue.length ? `${overdue.length} overdue` : 'All scheduled jobs staffed'}
          tone={unassigned.length ? 'danger' : 'success'}
        />
        <StatsCard
          title="Jobs today"
          value={todayJobs.length.toString()}
          detail={`${technicians.length} technicians available`}
        />
        <StatsCard
          title="Overdue"
          value={overdue.length.toString()}
          tone={overdue.length ? 'danger' : 'success'}
          detail={overdue.length ? 'Reschedule or assign ASAP' : 'Nothing overdue'}
        />
        <StatsCard
          title="Total upcoming"
          value={upcoming.length.toString()}
          detail={`${jobs.length} active jobs in system`}
        />
      </div>

      <div className="owner-sections">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Unassigned jobs</h2>
          {unassigned.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>All upcoming jobs have a technician assigned.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Scheduled</th>
                  <th>Technician</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((job) => {
                  const edit = getEdit(job.id)
                  return (
                    <tr key={job.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.address}</div>
                      </td>
                      <td>
                        <input
                          className="input"
                          type="datetime-local"
                          value={edit.scheduled_at}
                          onChange={(event) => handleEditChange(job.id, 'scheduled_at', event.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="input"
                          value={edit.technician_id}
                          onChange={(event) => handleEditChange(job.id, 'technician_id', event.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {technicians.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.full_name || tech.email || tech.id}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => handleSave(job.id)}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          <h3 style={{ marginTop: 32 }}>Create a new service visit</h3>
          <form onSubmit={handleCreateJob} className="form-grid" style={{ maxWidth: 520 }}>
            <label>Customer</label>
            <div className="grid cols-2" style={{ gap: 12 }}>
              <input
                className="input"
                placeholder="Search customers…"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
              />
              <select
                className="input"
                value={jobForm.customer_id}
                onChange={(event) => {
                  const value = event.target.value
                  handleJobFormChange('customer_id', value)
                  applyCustomerToForm(value)
                }}
                required
              >
                <option value="">Select customer…</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_name} • {customer.address}
                  </option>
                ))}
              </select>
            </div>

            <label>Customer name</label>
            <input
              className="input"
              value={jobForm.customer_name}
              onChange={(event) => handleJobFormChange('customer_name', event.target.value)}
              required
            />

            <label>Service address</label>
            <input
              className="input"
              value={jobForm.address}
              onChange={(event) => handleJobFormChange('address', event.target.value)}
              required
            />

            <label>Scheduled for</label>
            <input
              className="input"
              type="datetime-local"
              value={jobForm.scheduled_at}
              onChange={(event) => handleJobFormChange('scheduled_at', event.target.value)}
              required
            />

            <label>Assign technician (optional)</label>
            <select
              className="input"
              value={jobForm.technician_id}
              onChange={(event) => handleJobFormChange('technician_id', event.target.value)}
            >
              <option value="">Unassigned</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name || tech.email || tech.id}
                </option>
              ))}
            </select>

            {jobFormStatus === 'error' && jobFormError && <div style={{ color: 'var(--danger)' }}>{jobFormError}</div>}
            {jobFormStatus === 'success' && <div style={{ color: 'var(--success)' }}>Job created.</div>}

            <button className="btn" type="submit" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? 'Creating…' : 'Add job'}
            </button>
          </form>
        </section>

        <div className="owner-secondary-grid">
          <section className="card">
            <h2 style={{ marginTop: 0 }}>Today&apos;s route</h2>
            {todayJobs.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No jobs scheduled for today.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Scheduled</th>
                    <th>Technician</th>
                  </tr>
                </thead>
                <tbody>
                  {todayJobs.map((job) => {
                    const technician = technicians.find((t) => t.id === job.technician_id)
                    return (
                      <tr key={job.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.address}</div>
                        </td>
                        <td>{formatDisplayDate(job.scheduled_at)}</td>
                        <td>
                          {technician ? (
                            <>
                              <div>{technician.full_name || technician.email}</div>
                              {technician.phone && <div style={{ color: 'var(--muted)', fontSize: 13 }}>{technician.phone}</div>}
                            </>
                          ) : (
                            <span style={{ color: 'var(--danger)' }}>Unassigned</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0 }}>Recent job activity</h2>
            {recentCreates.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No jobs created yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recentCreates.map((job) => (
                  <li key={job.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
                    <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDisplayDate(job.scheduled_at)}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.address}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
