import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import StatsCard from '@components/StatsCard'
import { useAuth } from '@api/useAuth'
import {
  listCompanyProfiles,
  listCompanyJobs,
  listCompanyInventory,
  type ProfileSummary,
} from '@api/repo'
import { supabase } from '@api/supabaseClient'

const ESTIMATED_JOB_REVENUE = 120 // USD assumption until invoicing is connected

type InviteFormState = {
  role: 'admin' | 'dispatcher' | 'tech'
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

function formatCurrency(valueCents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valueCents / 100)
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

export default function OwnerDashboard() {
  const { profile } = useAuth()
  const companyId = profile?.company_id
  const qc = useQueryClient()

  const [inviteForm, setInviteForm] = React.useState<InviteFormState>({
    role: 'admin',
    fullName: '',
    email: '',
    phone: '',
  })
  const [inviteFeedback, setInviteFeedback] = React.useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({
    status: 'idle',
  })

  const workforceQuery = useQuery({
    queryKey: ['company-profiles', companyId],
    queryFn: () => listCompanyProfiles(companyId!),
    enabled: !!companyId,
  })

  const jobsQuery = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: () => listCompanyJobs(companyId!),
    enabled: !!companyId,
  })

  const inventoryQuery = useQuery({
    queryKey: ['company-inventory', companyId],
    queryFn: () => listCompanyInventory(companyId!),
    enabled: !!companyId,
  })

  const inviteMutation = useMutation({
    mutationFn: async (payload: InviteFormState) => {
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
        console.error('invite-team-member invoke error', error)
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
      setInviteFeedback({ status: 'success', message: 'Invitation sent. Your teammate will receive an email shortly.' })
      setInviteForm({ role: 'admin', fullName: '', email: '', phone: '' })
      qc.invalidateQueries({ queryKey: ['company-profiles', companyId] })
    },
    onError: (err) => {
      console.error(err)
      setInviteFeedback({ status: 'error', message: err instanceof Error ? err.message : 'Unable to send invite.' })
    },
  })

  const workforce = workforceQuery.data ?? []
  const jobs = jobsQuery.data ?? []
  const inventory = inventoryQuery.data ?? []

  const completedJobs = React.useMemo(() => jobs.filter((job) => !!job.completed_at), [jobs])
  const completedThisMonth = React.useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return completedJobs.filter((job) => job.completed_at && new Date(job.completed_at) >= startOfMonth)
  }, [completedJobs])

  const estimatedRevenue = completedThisMonth.length * ESTIMATED_JOB_REVENUE * 100 // in cents
  const upcomingJobs = React.useMemo(() => jobs.filter((job) => !job.completed_at), [jobs])

  const overdueJobs = React.useMemo(
    () => upcomingJobs.filter((job) => new Date(job.scheduled_at) < new Date()),
    [upcomingJobs]
  )

  const recentCompletions = React.useMemo(
    () =>
      [...completedJobs]
        .sort((a, b) => new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime())
        .slice(0, 5),
    [completedJobs]
  )

  const nextJobs = React.useMemo(
    () =>
      [...upcomingJobs]
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 5),
    [upcomingJobs]
  )

  const inventoryValue = React.useMemo(
    () => inventory.reduce((total, item) => total + item.price_cents * item.qty, 0),
    [inventory]
  )

  const workforceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    workforce.forEach((member) => {
      counts[member.role] = (counts[member.role] ?? 0) + 1
    })
    return counts
  }, [workforce])

  if (!companyId) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Owner dashboard</h2>
        <p>Your profile isn&apos;t linked to a company. Contact support to finish onboarding.</p>
      </div>
    )
  }

  const inviteDisabled = inviteMutation.isPending

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Owner dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Monitor the health of your company, keep your team roster up to date, and stay ahead of upcoming visits.
      </p>

      <div className="stats-grid">
        <StatsCard
          title="Revenue forecast (this month)"
          value={formatCurrency(estimatedRevenue)}
          detail={`${completedThisMonth.length} jobs completed`}
        />
        <StatsCard
          title="Open jobs"
          value={upcomingJobs.length.toString()}
          detail={overdueJobs.length > 0 ? `${overdueJobs.length} overdue` : 'All on schedule'}
          tone={overdueJobs.length > 0 ? 'danger' : 'default'}
        />
        <StatsCard
          title="Inventory on hand"
          value={formatCurrency(inventoryValue)}
          detail={`${inventory.length} items tracked`}
        />
        <StatsCard
          title="Team size"
          value={workforce.length.toString()}
          detail={`Admins ${workforceCounts['admin'] ?? 0} • Dispatch ${workforceCounts['dispatcher'] ?? 0} • Techs ${workforceCounts['tech'] ?? 0}`}
        />
      </div>

      <div className="owner-sections">
        <div className="owner-secondary-grid">
          <section className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Workforce</h2>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{workforce.length} members</span>
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
                {workforce.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                      No teammates yet. Use the invite tool to add your first team members.
                    </td>
                  </tr>
                )}
                {workforce.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{member.full_name || 'Unnamed teammate'}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{member.email ?? 'No email on file'}</div>
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
            <p style={{ color: 'var(--muted)' }}>Send a role-based invite to admins, dispatchers, or technicians.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                setInviteFeedback({ status: 'idle' })
                inviteMutation.mutate(inviteForm)
              }}
              className="form-grid"
              style={{ marginTop: 16 }}
            >
              <label>Role</label>
              <select
                className="input"
                value={inviteForm.role}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value as InviteFormState['role'] }))}
                disabled={inviteDisabled}
              >
                <option value="admin">Admin</option>
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
            <h2 style={{ marginTop: 0 }}>Recent completions</h2>
            {recentCompletions.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No jobs completed yet this month.</p>
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompletions.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{job.customer_name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{job.address}</div>
                      </td>
                      <td>{job.completed_at ? formatDate(job.completed_at) : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Job pipeline</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
            Upcoming visits ordered by schedule time. Stay ahead of overdue work.
          </p>
          {nextJobs.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No upcoming jobs scheduled.</p>
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
                      <td style={{ color: isOverdue ? 'var(--danger)' : 'var(--success)' }}>
                        {isOverdue ? 'Overdue' : 'Scheduled'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 16, color: 'var(--muted)', fontSize: 13 }}>
            Showing {nextJobs.length} of {upcomingJobs.length} open jobs.
          </div>
        </section>
      </div>
    </div>
  )
}
