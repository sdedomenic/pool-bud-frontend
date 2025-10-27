import React from 'react'
import { useAuth } from '@api/useAuth'
import { useNavigate, Link } from 'react-router-dom'

export default function Login(){
  const { signIn, signUp, user, ready } = useAuth()
  const nav = useNavigate()
  const [view, setView] = React.useState<'login' | 'signup' | 'signup-success'>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  React.useEffect(()=>{
    if (!ready) return
    if (user) nav('/app')        // after login go to Dashboard shell
  }, [ready, user, nav])

  React.useEffect(() => {
    setFormError(null)
    if (view !== 'signup') setConfirmPassword('')
  }, [view])

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    setFormError(null)
    const trimmedEmail = email.trim()
    if (view === 'login') {
      try {
        await signIn(trimmedEmail, password)
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Unable to log in. Try again.')
      }
    } else if (view === 'signup') {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.')
        return
      }
      try {
        await signUp(trimmedEmail, password)
        setCreatedEmail(trimmedEmail)
        setPassword('')
        setConfirmPassword('')
        setView('signup-success')
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Unable to create account. Try again.')
      }
    }
  }

  const heading = view === 'login'
    ? 'Welcome back'
    : view === 'signup'
      ? 'Create an account'
      : 'Account created'

  return (
    <div className="container" style={{maxWidth:420}}>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{marginTop:0}}>{heading}</h2>
          <Link to="/" className="tag">← Home</Link>
        </div>

        {view === 'signup-success' ? (
          <div>
            <p>
              {createdEmail
                ? `Account created for ${createdEmail}. Check your inbox for a confirmation email, then log in.`
                : 'Account created. Check your inbox for a confirmation email, then log in.'}
            </p>
            <div className="spacer"></div>
            <button className="btn" type="button" onClick={()=>setView('login')}>
              Go to login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
              <div className="spacer"></div>
              <label>Password</label>
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
              {view === 'signup' && (
                <>
                  <div className="spacer"></div>
                  <label>Confirm Password</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e=>setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={()=>setShowConfirmPassword(s=>!s)}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </>
              )}
              {formError && (
                <>
                  <div className="spacer"></div>
                  <div style={{ color: 'var(--danger)', fontSize: 14 }}>{formError}</div>
                </>
              )}
              <div className="spacer"></div>
              <button className="btn" type="submit">
                {view === 'login' ? 'Log in' : 'Sign up'}
              </button>
              {view === 'login' && (
                <>
                  <div className="spacer"></div>
                  <Link className="btn secondary" to="/forgot-password">
                    Forgot password?
                  </Link>
                </>
              )}
            </form>

            <div className="spacer"></div>
            <div style={{fontSize:14, color:'var(--muted)'}}>
              {view === 'login' ? (
                <>No account? <button className="btn secondary" type="button" onClick={()=>setView('signup')}>Create one</button></>
              ) : (
                <>Already have an account? <button className="btn secondary" type="button" onClick={()=>setView('login')}>Log in</button></>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
