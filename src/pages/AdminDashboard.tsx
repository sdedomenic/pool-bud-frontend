import React from 'react'
import { useAuth } from '@api/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import StatsCard from '@components/StatsCard'
import {
  listCompanyJobs,
  listCompanyProfiles,
  listCompanyInventory,
  type ProfileSummary,
} from '@api/repo'
import { supabase } from '@api/supabaseClient'

const LOW_STOCK_THRESHOLD = 5
const ESTIMATED_JOB_REVENUE = 120 // USD assumption until financials are wired in

type InviteForm = {
  role: 'dispatcher' | 'tech'
  fullName: string
  email: string
  phone: string
}

const roleLabels: Record<ProfileSummary['role'], string> = {
  platform_admin: 'Platform Admin',
  owner: 'Owner',
  admin: 'Admin',
  dispatcher: 'Dispatcher',
  tech: 'Technician',
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountCents / 100)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const companyId = profile?.company_id
  const qc = useQueryClient()

  const [inviteForm, setInviteForm] = React.useState<InviteForm>({
    role: 'dispatcher',
    fullName: '',
    email: '',
    phone: '',
  })
  const [inviteFeedback, setInviteFeedback] = React.useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' })

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
  const inventoryQuery = useQuery({
    queryKey: ['company-inventory', companyId],
    queryFn: () => listCompanyInventory(companyId!),
    enabled: !!companyId,
  })

  const inviteMutation = useMutation({
    mutationFn: async (payload: InviteForm) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('You must be signed in to invite teammates.')

      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: {
          role: payload.role,
          email: payload.email.trim(),
          fullName: payload.fullName.trim(),
          phone: payload.phone.trim() || null,
          inviteRedirectUrl: typeof window !== 'undefined' ? `${window.location.origin}/welcome` : undefined,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (error) {
        console.error('invite-team-member error', error)
        throw new Error(error.message ?? 'Failed to reach invite function.')
      }
      if (data?.error) {
        const message =
          typeof data.error === 'string'
            ? data.error
            : (data.error?.message as string) ?? 'Invite function returned an error.'
        throw new Error(message)
      }
      return data as { userId: string }
    },
    onSuccess: () => {
      setInviteFeedback({ status: 'success', message: 'Invitation sent.' })
      setInviteForm({ role: 'dispatcher', fullName: '', email: '', phone: '' })
      qc.invalidateQueries({ queryKey: ['company-profiles', companyId] })
    },
    onError: (err) => {
      console.error(err)
      setInviteFeedback({ status: 'error', message: err instanceof Error ? err.message : 'Unable to send invite.' })
    },
  })

  const jobs = jobsQuery.data ?? []
  const teammates = (profilesQuery.data ?? []).filter((p) => p.role === 'dispatcher' || p.role === 'tech')
  const inventory = inventoryQuery.data ?? []

  if (!companyId) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Admin dashboard</h2>
        <p>Your profile isn&apos;t tied to a company yet. Contact the owner for access.</p>
      </div>
    )
  }

  const upcomingJobs = jobs.filter((job) => !job.completed_at)
  const overdueJobs = upcomingJobs.filter((job) => new Date(job.scheduled_at) < new Date())
  const todayJobs = upcomingJobs.filter((job) => {
    const scheduled = new Date(job.scheduled_at)
    const now = new Date()
    return (
      scheduled.getFullYear() === now.getFullYear() &&
      scheduled.getMonth() === now.getMonth() &&
      scheduled.getDate() === now.getDate()
    )
  })
  const completedThisWeek = jobs.filter((job) => {
    if (!job.completed_at) return false
    const done = new Date(job.completed_at)
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    return done >= startOfWeek
  })
  const estimatedRevenue = completedThisWeek.length * ESTIMATED_JOB_REVENUE * 100

  const lowInventory = inventory.filter((item) => item.qty <= LOW_STOCK_THRESHOLD)

  const inviteDisabled = inviteMutation.isPending

  const nextJobs = [...upcomingJobs]
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 6)

  const recentCompletions = [...jobs]
    .filter((job) => !!job.completed_at)
    .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())
    .slice(0, 5)

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Admin dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Track the day&apos;s workload, coordinate technicians, and stay ahead of inventory needs.
      </p>

      <div className="stats-grid">
        <StatsCard title="Jobs today" value={todayJobs.length.toString()} detail={`${overdueJobs.length} overdue`} tone={overdueJobs.length ? 'danger' : 'default'} />
        <StatsCard
          title="Completed this week"
          value={completedThisWeek.length.toString()}
          detail={`≈ ${formatCurrency(estimatedRevenue)} invoiced`}
        />
        <StatsCard
          title="Active technicians"
          value={teammates.filter((t) => t.role === 'tech').length.toString()}
          detail={`${teammates.filter((t) => t.role === 'dispatcher').length} dispatchers available`}
        />
        <StatsCard
          title="Low inventory"
          value={lowInventory.length.toString()}
          detail={lowInventory.length ? 'Review restock list below' : 'All stocked'}
          tone={lowInventory.length ? 'danger' : 'success'}
        />
      </div>

      <div className="owner-sections">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Upcoming jobs</h2>
          {nextJobs.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No open jobs scheduled.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {nextJobs.map((job) => {
                  const isOverdue = new Date(job.scheduled_at) < new Date()
                  return (
                    <tr key={job.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.address}</div>
                      </td>
                      <td>{formatDate(job.scheduled_at)}</td>
                      <td style={{ color: isOverdue ? 'var(--danger)' : 'var(--primary)' }}>
                        {isOverdue ? 'Overdue' : 'Scheduled'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>
            Showing {nextJobs.length} of {upcomingJobs.length} upcoming jobs.
          </div>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginTop: 0 }}>Recent completions</h3>
            {recentCompletions.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No jobs completed recently.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recentCompletions.map((job) => (
                  <li key={job.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.completed_at ? formatDate(job.completed_at) : '--'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="owner-secondary-grid">
          <section className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Team roster</h2>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{teammates.length} members</span>
            </header>
            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {teammates.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                      No dispatchers or technicians yet.
                    </td>
                  </tr>
                )}
                {teammates.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{member.full_name || 'Unnamed teammate'}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{member.email ?? 'No email'}</div>
                    </td>
                    <td>{roleLabels[member.role]}</td>
                    <td>
                      {member.phone && <div>{member.phone}</div>}
                      {[member.city, member.state].filter(Boolean).length > 0 && (
                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                          {[member.city, member.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0 }}>Invite a teammate</h2>
            <p style={{ color: 'var(--muted)' }}>Admins can invite dispatchers and technicians.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                setInviteFeedback({ status: 'idle' })
                inviteMutation.mutate(inviteForm)
              }}
              className="form-grid"
              style={{ marginTop: 12 }}
            >
              <label>Role</label>
              <select
                className="input"
                value={inviteForm.role}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value as InviteForm['role'] }))}
                disabled={inviteDisabled}
              >
                <option value="dispatcher">Dispatcher / Customer Service</option>
                <option value="tech">Technician</option>
              </select>

              <label>Full name</label>
              <input
                className="input"
                value={inviteForm.fullName}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
                disabled={inviteDisabled}
              />

              <label>Email</label>
              <input
                className="input"
                type="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                disabled={inviteDisabled}
              />

              <label>Phone (optional)</label>
              <input
                className="input"
                value={inviteForm.phone}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="555-555-5555"
                disabled={inviteDisabled}
              />

              {inviteFeedback.status === 'error' && (
                <div style={{ color: 'var(--danger)' }}>{inviteFeedback.message}</div>
              )}
              {inviteFeedback.status === 'success' && (
                <div style={{ color: 'var(--success)' }}>{inviteFeedback.message}</div>
              )}

              <button className="btn" type="submit" disabled={inviteDisabled}>
                {inviteDisabled ? 'Sending…' : 'Send invite'}
              </button>
            </form>
          </section>

          <section className="card">
            <h2 style={{ marginTop: 0 }}>Low inventory alerts</h2>
            {lowInventory.length === 0 ? (
              <p style={{ color: 'var(--success)' }}>All inventory is above the reorder threshold.</p>
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {lowInventory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td style={{ color: 'var(--danger)' }}>{item.qty}</td>
                      <td>{formatCurrency(item.price_cents * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
