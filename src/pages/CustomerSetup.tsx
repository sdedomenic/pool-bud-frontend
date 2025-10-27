import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@api/supabaseClient'
import { updateCustomer } from '@api/repo'

const initialState = {
  full_name: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
}

type FormState = typeof initialState

export default function CustomerSetup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const customerId = params.get('customerId')

  const [sessionChecked, setSessionChecked] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(initialState)
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [customerName, setCustomerName] = React.useState<string>('')

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        navigate('/login', { replace: true })
        return
      }

      if (!customerId) {
        setErrorMessage('Missing customer ID in link.')
        return
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .select('customer_name, address, phone')
        .eq('id', customerId)
        .maybeSingle()
      if (error || !customer) {
        setErrorMessage('We could not find your customer record. Contact your service provider for help.')
        return
      }

      setCustomerName(customer.customer_name)
      setForm((prev) => ({
        ...prev,
        full_name: customer.customer_name ?? '',
        address: customer.address ?? '',
        phone: customer.phone ?? '',
      }))
      setSessionChecked(true)
    })()
  }, [customerId, navigate])

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setStatus('idle')
    setErrorMessage(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!customerId) return
    if (!form.password) {
      setErrorMessage('Please choose a password so you can log in later.')
      setStatus('error')
      return
    }
    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      setStatus('error')
      return
    }

    try {
      setStatus('saving')
      const { error: passwordError } = await supabase.auth.updateUser({ password: form.password })
      if (passwordError) throw passwordError

      await updateCustomer(customerId, {
        customer_name: form.full_name.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || null,
      })

      setStatus('success')
      setTimeout(() => navigate(`/customer/${customerId}`), 800)
    } catch (error) {
      console.error('customer setup error', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unable to finish setup.')
    }
  }

  if (!customerId) {
    return (
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Customer setup</h2>
          <p>Missing customer ID. Please use the link in your email invite.</p>
        </div>
      </div>
    )
  }

  if (!sessionChecked) {
    return (
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <p>Loading your account…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 520, paddingBottom: 40 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Welcome, {customerName || 'customer'}</h1>
        <p style={{ color: 'var(--muted)' }}>
          Set a password and confirm your contact details so you can view your visit history anytime.
        </p>

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
          <label>Full name</label>
          <input className="input" value={form.full_name} onChange={(event) => handleChange('full_name', event.target.value)} required />

          <label>Phone</label>
          <input className="input" value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="555-555-5555" />

          <label>Service address</label>
          <input className="input" value={form.address} onChange={(event) => handleChange('address', event.target.value)} required />

          <label>Create password</label>
          <input className="input" type="password" value={form.password} onChange={(event) => handleChange('password', event.target.value)} required />

          <label>Confirm password</label>
          <input
            className="input"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => handleChange('confirmPassword', event.target.value)}
            required
          />

          {errorMessage && <div style={{ color: 'var(--danger)' }}>{errorMessage}</div>}
          {status === 'success' && <div style={{ color: 'var(--success)' }}>Setup complete! Redirecting…</div>}

          <button className="btn" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Finish setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
