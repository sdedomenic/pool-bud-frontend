import React from 'react'
import { useAuth } from '@api/useAuth'
import { Link, useNavigate } from 'react-router-dom'

export default function ResetPassword(){
  const { ready, isRecoveringPassword, updatePassword, signOut } = useAuth()
  const nav = useNavigate()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'idle' | 'success'>('idle')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)

  React.useEffect(() => {
    setError(null)
  }, [password, confirm])

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    try {
      await updatePassword(password)
      await signOut()
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password. Try again.')
    }
  }

  React.useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => nav('/login'), 4000)
      return () => clearTimeout(timer)
    }
  }, [status, nav])

  if (!ready) return <div className="container" style={{ maxWidth: 420 }}><div className="card"><p>Loading…</p></div></div>

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{marginTop:0}}>Set a new password</h2>
          <Link to="/" className="tag">← Home</Link>
        </div>

        {status === 'success' ? (
          <div>
            <p>Password updated. You can now log in with your new credentials.</p>
            <div className="spacer"></div>
            <Link className="btn" to="/login">Back to login</Link>
          </div>
        ) : isRecoveringPassword ? (
          <form onSubmit={handleSubmit}>
            <label>New password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
              />
              <button
                className="btn secondary"
                type="button"
                onClick={()=>setShowPassword(s=>!s)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="spacer"></div>
            <label>Confirm password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e=>setConfirm(e.target.value)}
                required
              />
              <button
                className="btn secondary"
                type="button"
                onClick={()=>setShowConfirm(s=>!s)}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {error && (
              <>
                <div className="spacer"></div>
                <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>
              </>
            )}
            <div className="spacer"></div>
            <button className="btn" type="submit">Update password</button>
            <div className="spacer"></div>
            <Link className="btn secondary" to="/login">Cancel</Link>
          </form>
        ) : (
          <div>
            <p>
              This page is only available after using the password recovery link in your email.
              Request a new link from the <Link to="/forgot-password">forgot password</Link> page.
            </p>
            <div className="spacer"></div>
            <Link className="btn secondary" to="/login">Back to login</Link>
          </div>
        )}
      </div>
    </div>
  )
}
