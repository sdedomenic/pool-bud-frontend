import React from 'react'
import { useAuth } from '@api/useAuth'
import { Link } from 'react-router-dom'

export default function ForgotPassword(){
  const { resetPassword } = useAuth()
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'submitted'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your email address.')
      return
    }
    try {
      await resetPassword(trimmed)
      setStatus('submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset instructions. Try again.')
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{marginTop:0}}>Reset your password</h2>
          <Link to="/" className="tag">← Home</Link>
        </div>

        {status === 'submitted' ? (
          <div>
            <p>
              Check <strong>{email.trim()}</strong> for an email from us with a reset link.
              Follow the link to choose a new password, then return to the login page.
            </p>
            <div className="spacer"></div>
            <Link className="btn" to="/login">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
            />
            {error && (
              <>
                <div className="spacer"></div>
                <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>
              </>
            )}
            <div className="spacer"></div>
            <button className="btn" type="submit">Send reset link</button>
            <div className="spacer"></div>
            <Link className="btn secondary" to="/login">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  )
}
