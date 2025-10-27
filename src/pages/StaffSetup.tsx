import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignOwnerToCompany,
  listCompanies,
  listProfiles,
  updateCompany,
  type Company,
  type ProfileSummary,
} from '@api/repo'
import { supabase } from '@api/supabaseClient'

export default function StaffSetup() {
  const qc = useQueryClient()
  const [editing, setEditing] = React.useState<Record<string, { name: string; stripe: string }>>({})
  const [ownerSelection, setOwnerSelection] = React.useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = React.useState('')
  const [inviteForm, setInviteForm] = React.useState({
    mode: 'existing' as 'existing' | 'new',
    companyId: '',
    companyName: '',
    stripeAccountId: '',
    ownerEmail: '',
    ownerName: '',
    ownerPhone: '',
  })

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
  })

  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  })

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; stripe?: string } }) =>
      updateCompany(id, {
        name: updates.name,
        stripe_account_id: updates.stripe ?? null,
      }),
    onSuccess: (_, variables) => {
      setEditing((prev) => {
        const next = { ...prev }
        delete next[variables.id]
        return next
      })
      qc.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  const assignOwnerMutation = useMutation({
    mutationFn: ({ companyId, profileId }: { companyId: string; profileId: string }) =>
      assignOwnerToCompany(companyId, profileId).then(() => {
        qc.invalidateQueries({ queryKey: ['profiles'] })
      }),
  })

  const inviteOwnerMutation = useMutation({
    mutationFn: async () => {
      if (!inviteForm.ownerEmail.trim() || !inviteForm.ownerName.trim()) {
        throw new Error('Owner name and email are required.')
      }
      const payload: Record<string, unknown> = {
        owner: {
          email: inviteForm.ownerEmail.trim(),
          fullName: inviteForm.ownerName.trim(),
          phone: inviteForm.ownerPhone.trim() || null,
        },
        inviteRedirectUrl:
          typeof window !== 'undefined' ? `${window.location.origin}/welcome` : undefined,
      }
      if (inviteForm.mode === 'existing') {
        if (!inviteForm.companyId) throw new Error('Select a company to assign the owner to.')
        payload.companyId = inviteForm.companyId
      } else {
        if (!inviteForm.companyName.trim()) throw new Error('Company name is required for new companies.')
        payload.companyName = inviteForm.companyName.trim()
        payload.stripeAccountId = inviteForm.stripeAccountId.trim() || null
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('You must be signed in to invite an owner.')
      }

      const headers =
        session?.access_token != null
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined

      const { data, error } = await supabase.functions.invoke('invite-owner', {
        body: payload,
        headers,
      })
      if (error) {
        console.error('invite-owner invoke error', error)
        const message =
          error.message === 'Failed to send a request to the Edge Function'
            ? `${error.message}. Ensure the function is deployed (supabase functions deploy invite-owner).`
            : error.message ?? 'Failed to reach the invite-owner function.'
        throw new Error(message)
      }
      if (data?.error) {
        const message =
          typeof data.error === 'string'
            ? data.error
            : (data.error?.message as string) ?? 'Edge Function reported an error.'
        throw new Error(message)
      }
      return data as { companyId: string }
    },
    onSuccess: (data) => {
      setInviteForm((prev) => ({
        mode: prev.mode,
        companyId: prev.mode === 'existing' ? prev.companyId : '',
        companyName: '',
        stripeAccountId: '',
        ownerEmail: '',
        ownerName: '',
        ownerPhone: '',
      }))
      if (data?.companyId) {
        qc.invalidateQueries({ queryKey: ['companies'] })
      }
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })

  const companies = companiesQuery.data ?? []
  const filteredCompanies = companies.filter((company) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return company.name.toLowerCase().includes(q) || company.id.toLowerCase().includes(q)
  })
  const profiles = profilesQuery.data ?? []

  const ownerOptions = React.useMemo(
    () =>
      profiles.filter((p) => p.role !== 'platform_admin').map((p) => ({
        id: p.id,
        email: p.email ?? '(no email)',
        role: p.role,
        companyId: p.company_id,
        name: p.full_name ?? '',
        phone: p.phone ?? '',
        city: p.city ?? '',
        state: p.state ?? '',
        country: p.country ?? '',
      })),
    [profiles]
  )

  function currentOwnerFor(companyId: string): ProfileSummary | undefined {
    return profiles.find((p) => p.company_id === companyId && p.role === 'owner')
  }

  function handleEditChange(company: Company, field: 'name' | 'stripe', value: string) {
    setEditing((prev) => {
      const existing = prev[company.id] ?? {
        name: company.name,
        stripe: company.stripe_account_id ?? '',
      }
      return {
        ...prev,
        [company.id]: {
          ...existing,
          [field]: value,
        },
      }
    })
  }

  function editingValues(company: Company) {
    if (!editing[company.id]) {
      return {
        name: company.name,
        stripe: company.stripe_account_id ?? '',
      }
    }
    return editing[company.id]
  }

  function handleAssignOwner(companyId: string) {
    const selected = ownerSelection[companyId]
    if (!selected) return
    assignOwnerMutation.mutate({ companyId, profileId: selected })
  }

  return (
    <div>
      <h1>Company & Owner Setup</h1>
      <p style={{ maxWidth: 640 }}>
        Use these tools to provision new companies, invite their primary owners, and manage ownership over time.
        Owner invitations send an email so they can finish setting up their password before logging in.
      </p>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Invite a new owner</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            inviteOwnerMutation.mutate()
          }}
        >
          <fieldset style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio"
                name="company-mode"
                value="existing"
                checked={inviteForm.mode === 'existing'}
                onChange={() => setInviteForm((prev) => ({ ...prev, mode: 'existing' }))}
              />
              Use existing company
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="radio"
                name="company-mode"
                value="new"
                checked={inviteForm.mode === 'new'}
                onChange={() => setInviteForm((prev) => ({ ...prev, mode: 'new', companyId: '' }))}
              />
              Create new company
            </label>
          </fieldset>

          {inviteForm.mode === 'existing' ? (
            <>
              <label>Company</label>
              <select
                className="input"
                value={inviteForm.companyId}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, companyId: e.target.value }))}
              >
                <option value="">Select a company…</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} · {company.id.slice(0, 8)}
                  </option>
                ))}
              </select>
              <div className="spacer" />
            </>
          ) : (
            <>
              <label>Company name</label>
              <input
                className="input"
                value={inviteForm.companyName}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, companyName: e.target.value }))}
                required
              />
              <div className="spacer" />
              <label>Stripe account ID (optional)</label>
              <input
                className="input"
                value={inviteForm.stripeAccountId}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, stripeAccountId: e.target.value }))}
                placeholder="acct_123..."
              />
              <div className="spacer" />
            </>
          )}

          <label>Owner full name</label>
          <input
            className="input"
            value={inviteForm.ownerName}
            onChange={(e) => setInviteForm((prev) => ({ ...prev, ownerName: e.target.value }))}
            required
          />
          <div className="spacer" />

          <label>Owner email</label>
          <input
            className="input"
            type="email"
            value={inviteForm.ownerEmail}
            onChange={(e) => setInviteForm((prev) => ({ ...prev, ownerEmail: e.target.value }))}
            required
          />
          <div className="spacer" />

          <label>Owner phone (optional)</label>
          <input
            className="input"
            value={inviteForm.ownerPhone}
            onChange={(e) => setInviteForm((prev) => ({ ...prev, ownerPhone: e.target.value }))}
            placeholder="555-555-5555"
          />
          <div className="spacer" />

          <button className="btn" type="submit" disabled={inviteOwnerMutation.isPending}>
            {inviteOwnerMutation.isPending ? 'Sending invite…' : 'Send invite'}
          </button>
          {inviteOwnerMutation.isError && (
            <p style={{ color: 'var(--danger)', marginTop: 12 }}>
              {(inviteOwnerMutation.error as Error).message ?? 'Unable to invite owner.'}
            </p>
          )}
          {inviteOwnerMutation.isSuccess && !inviteOwnerMutation.isPending && !inviteOwnerMutation.isError && (
            <p style={{ color: 'var(--success)', marginTop: 12 }}>
              Invitation sent. The owner will receive an email to finish setting up their account.
            </p>
          )}
        </form>
      </section>

      <section>
        <h2>Existing companies</h2>
        <div style={{ maxWidth: 360, marginBottom: 16 }}>
          <label htmlFor="company-search">Search companies</label>
          <input
            id="company-search"
            className="input"
            placeholder="Start typing a name or company ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {companiesQuery.isError ? (
          <p style={{ color: 'var(--danger)' }}>
            {(companiesQuery.error as Error).message ?? 'Unable to load companies.'}
          </p>
        ) : companiesQuery.isLoading ? (
          <p>Loading companies…</p>
        ) : filteredCompanies.length === 0 ? (
          <p>No companies yet.</p>
        ) : (
          <div className="grid">
            {filteredCompanies.map((company) => {
              const values = editingValues(company)
              const owner = currentOwnerFor(company.id)
              const selectedOwner = ownerSelection[company.id] ?? owner?.id ?? ''

              return (
                <div key={company.id} className="card" style={{ minWidth: 320 }}>
                  <h3 style={{ marginTop: 0 }}>{company.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>ID: {company.id}</div>
                  <div className="spacer" />
                  <label>Company name</label>
                  <input
                    className="input"
                    value={values.name}
                    onChange={(e) => handleEditChange(company, 'name', e.target.value)}
                  />
                  <div className="spacer" />
                  <label>Stripe account ID</label>
                  <input
                    className="input"
                    value={values.stripe}
                    onChange={(e) => handleEditChange(company, 'stripe', e.target.value)}
                    placeholder="acct_123..."
                  />
                  <div className="spacer" />
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() =>
                      updateCompanyMutation.mutate({
                        id: company.id,
                        updates: { name: values.name, stripe: values.stripe },
                      })
                    }
                    disabled={updateCompanyMutation.isPending}
                  >
                    {updateCompanyMutation.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                  {updateCompanyMutation.isError && (
                    <p style={{ color: 'var(--danger)', marginTop: 12 }}>
                      {(updateCompanyMutation.error as Error).message ?? 'Unable to update company.'}
                    </p>
                  )}

                  <div className="spacer" />
                  <div style={{ borderTop: '1px solid #e6e6e6', margin: '16px 0' }} />
                  <strong>Owner</strong>
                  <div style={{ marginTop: 4, fontSize: 14 }}>
                    {owner ? (
                      <>
                        <div>{owner.full_name ? `${owner.full_name} • ` : ''}{owner.email ?? owner.id}</div>
                        {owner.phone && <div style={{ color: 'var(--muted)' }}>{owner.phone}</div>}
                        {(owner.address_line1 || owner.city) && (
                          <div style={{ color: 'var(--muted)' }}>
                            {[owner.address_line1, owner.address_line2].filter(Boolean).join(', ')}
                            <br />
                            {[owner.city, owner.state, owner.postal_code].filter(Boolean).join(', ')}
                            {owner.country ? ` ${owner.country}` : ''}
                          </div>
                        )}
                      </>
                    ) : (
                      'No owner assigned'
                    )}
                  </div>
                  <div className="spacer" />
                  <label htmlFor={`owner-${company.id}`}>Assign owner</label>
                  {profilesQuery.isError ? (
                    <p style={{ color: 'var(--danger)' }}>
                      {(profilesQuery.error as Error).message ?? 'Unable to load profiles.'}
                    </p>
                  ) : (
                    <select
                      id={`owner-${company.id}`}
                      className="input"
                      value={selectedOwner}
                      onChange={(e) =>
                        setOwnerSelection((prev) => ({
                          ...prev,
                          [company.id]: e.target.value,
                        }))
                      }
                      disabled={profilesQuery.isLoading}
                    >
                      <option value="">Select a profile…</option>
                      {profilesQuery.isLoading ? (
                        <option value="" disabled>
                          Loading users…
                        </option>
                      ) : (
                        ownerOptions.map((option) => {
                          const locationParts = [option.city, option.state, option.country].filter(Boolean)
                          const location = locationParts.join(', ')
                          return (
                            <option key={option.id} value={option.id}>
                              {option.name ? `${option.name} · ` : ''}
                              {option.email} · {option.role}
                              {option.companyId ? ` · company ${option.companyId.slice(0, 4)}…` : ' · unassigned'}
                              {location ? ` · ${location}` : ''}
                            </option>
                          )
                        })
                      )}
                    </select>
                  )}
                  <div className="spacer" />
                  <button
                    className="btn"
                    type="button"
                    onClick={() => handleAssignOwner(company.id)}
                    disabled={!selectedOwner || assignOwnerMutation.isPending}
                  >
                    {assignOwnerMutation.isPending ? 'Assigning…' : 'Update owner'}
                  </button>
                  {assignOwnerMutation.isError && (
                    <p style={{ color: 'var(--danger)', marginTop: 12 }}>
                      {(assignOwnerMutation.error as Error).message ?? 'Unable to assign owner.'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
