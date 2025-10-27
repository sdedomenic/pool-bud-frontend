import React from 'react'
import { useAuth } from '@api/useAuth'
import { updateProfileContactInfo } from '@api/repo'
import { supabase } from '@api/supabaseClient'
import { useNavigate } from 'react-router-dom'

type FormState = {
  full_name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  password: string
  confirmPassword: string
}

const initialState: FormState = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  password: '',
  confirmPassword: '',
}

export default function WelcomeOnboarding() {
  const { profile, profileLoading, refreshProfile, user } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = React.useState<FormState>(initialState)
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!profile) return
    setForm((prev) => ({
      ...prev,
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      postal_code: profile.postal_code ?? '',
      country: profile.country ?? '',
      password: '',
      confirmPassword: '',
    }))
  }, [profile])

  React.useEffect(() => {
    if (profile?.has_completed_setup) {
      nav('/app', { replace: true })
    }
  }, [profile?.has_completed_setup, nav])

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setStatus('idle')
    setErrorMessage(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile) return

    if (!form.password) {
      setStatus('error')
      setErrorMessage('Set a password to continue.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setStatus('error')
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setStatus('saving')
      setErrorMessage(null)

      const { error: passwordError } = await supabase.auth.updateUser({ password: form.password })
      if (passwordError) throw passwordError

      await updateProfileContactInfo(profile.id, {
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        address_line1: form.address_line1.trim() || null,
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        postal_code: form.postal_code.trim() || null,
        country: form.country.trim() || null,
        has_completed_setup: true,
      })

      await refreshProfile()
      setStatus('success')
      setTimeout(() => nav('/app', { replace: true }), 800)
    } catch (error) {
      console.error('welcome onboarding error', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unable to complete setup.')
    }
  }

  if (profileLoading || !user) {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <p>Checking your account…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginTop: 0 }}>Set up your account</h2>
        <p>We couldn&apos;t find your profile details. Try signing out and opening the invite link again.</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h1 style={{ marginTop: 0 }}>Welcome to The Pool Bud</h1>
      <p style={{ color: 'var(--muted)' }}>
        Tell us a bit about yourself so the team knows how to reach you. You&apos;ll use this password the next time you log in.
      </p>

      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
        <label>Full name</label>
        <input className="input" value={form.full_name} onChange={handleChange('full_name')} required />

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

        <label>Create password</label>
        <input className="input" type="password" value={form.password} onChange={handleChange('password')} required />

        <label>Confirm password</label>
        <input className="input" type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} required />

        {errorMessage && <div style={{ color: 'var(--danger)' }}>{errorMessage}</div>}
        {status === 'success' && <div style={{ color: 'var(--success)' }}>Setup complete! Redirecting…</div>}

        <button className="btn" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Finish setup'}
        </button>
      </form>
    </div>
  )
}

