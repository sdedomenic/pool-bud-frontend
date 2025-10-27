import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@api/useAuth'
import { updateProfileContactInfo } from '@api/repo'
import { supabase } from '@api/supabaseClient'

const initialState = {
  full_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
}

type FormState = typeof initialState

export default function AccountSettings() {
  const { profile, profileLoading, user, refreshProfile } = useAuth()
  const [form, setForm] = React.useState<FormState>(initialState)
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      email: profile.email ?? user?.email ?? '',
      phone: profile.phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      postal_code: profile.postal_code ?? '',
      country: profile.country ?? '',
    })
  }, [profile, user?.email])

  const mutation = useMutation({
    mutationFn: async (payload: FormState) => {
      if (!profile?.id) throw new Error('Profile not loaded')

      if (!payload.email.trim()) {
        throw new Error('Email is required.')
      }

      if (payload.email.trim() !== (user?.email ?? '')) {
        const { error } = await supabase.auth.updateUser({ email: payload.email.trim() })
        if (error) throw error
      }

      await updateProfileContactInfo(profile.id, {
        full_name: payload.full_name.trim() || null,
        email: payload.email.trim(),
        phone: payload.phone.trim() || null,
        address_line1: payload.address_line1.trim() || null,
        address_line2: payload.address_line2.trim() || null,
        city: payload.city.trim() || null,
        state: payload.state.trim() || null,
        postal_code: payload.postal_code.trim() || null,
        country: payload.country.trim() || null,
      })

      await refreshProfile()
    },
    onSuccess: () => {
      setStatus('success')
      setErrorMessage(null)
    },
    onError: (error) => {
      console.error('update profile error:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save your profile.')
    },
  })

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setStatus('idle')
    setErrorMessage(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    mutation.mutate(form)
  }

  if (profileLoading && !profile) {
    return (
      <div className="card">
        <p>Loading profile…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Account</h2>
        <p>We couldn&apos;t load your profile. Please try signing out and back in.</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2 style={{ marginTop: 0 }}>Account details</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Keep your contact information up to date so teammates know how to reach you.
      </p>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>Full name</label>
        <input className="input" value={form.full_name} onChange={handleChange('full_name')} />

        <label>Email</label>
        <input className="input" type="email" value={form.email} onChange={handleChange('email')} required />
        <small style={{ color: 'var(--muted)' }}>
          Updating your email sends a confirmation message from Supabase before changes apply.
        </small>

        <label>Phone</label>
        <input className="input" value={form.phone} onChange={handleChange('phone')} placeholder="555-555-5555" />

        <label>Address line 1</label>
        <input className="input" value={form.address_line1} onChange={handleChange('address_line1')} />

        <label>Address line 2</label>
        <input className="input" value={form.address_line2} onChange={handleChange('address_line2')} />

        <div className="grid cols-3" style={{ gap: 12 }}>
          <div>
            <label>City</label>
            <input className="input" value={form.city} onChange={handleChange('city')} />
          </div>
          <div>
            <label>State / Province</label>
            <input className="input" value={form.state} onChange={handleChange('state')} />
          </div>
          <div>
            <label>Postal code</label>
            <input className="input" value={form.postal_code} onChange={handleChange('postal_code')} />
          </div>
        </div>

        <label>Country</label>
        <input className="input" value={form.country} onChange={handleChange('country')} />

        {errorMessage && (
          <div style={{ color: 'var(--danger)', marginTop: 12 }}>{errorMessage}</div>
        )}
        {status === 'success' && (
          <div style={{ color: 'var(--success)', marginTop: 12 }}>Profile updated.</div>
        )}

        <div className="spacer" />
        <button className="btn" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

