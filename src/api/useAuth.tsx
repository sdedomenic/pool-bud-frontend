import React from 'react'
import { supabase } from './supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

type Role = 'platform_admin' | 'owner' | 'admin' | 'dispatcher' | 'tech'
export type Profile = {
  id: string
  company_id: string | null
  role: Role
  full_name: string | null
  email: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  has_completed_setup: boolean
}

type Ctx = {
  user: User | null
  session: Session | null
  ready: boolean
  isRecoveringPassword: boolean
  profile: Profile | null
  profileLoading: boolean
  refreshProfile: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}
const AuthCtx = React.createContext<Ctx>(null as any)

export function AuthProvider({children}:{children: React.ReactNode}) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [user, setUser] = React.useState<User | null>(null)
  const [ready, setReady] = React.useState(false)
  const [isRecoveringPassword, setIsRecoveringPassword] = React.useState(false)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = React.useState(true)

  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) console.warn('getSession error:', error)
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setReady(true)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setIsRecoveringPassword(true)
      if (event === 'SIGNED_OUT') setIsRecoveringPassword(false)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const refreshProfile = React.useCallback(async () => {
    if (!ready) return
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    const { data, error } = await supabase
      .from('profiles')
        .select('id, company_id, role, full_name, email, phone, address_line1, address_line2, city, state, postal_code, country, has_completed_setup')
      .eq('id', user.id)
      .maybeSingle()
    if (error) {
      console.warn('loadProfile error:', error)
      setProfile(null)
    } else {
      setProfile((data as Profile | null) ?? null)
    }
    setProfileLoading(false)
  }, [ready, user?.id])

  React.useEffect(() => {
    if (!ready) return
    let cancelled = false
    const run = async () => {
      if (cancelled) return
      await refreshProfile()
    }
    run()
    return () => {
      cancelled = true
    }
  }, [ready, refreshProfile])

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut(){
    await supabase.auth.signOut()
    setIsRecoveringPassword(false)
  }

  async function resetPassword(email: string) {
    const { error, data } = await supabase.functions.invoke('send-reset-link', {
      body: { email },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setIsRecoveringPassword(false)
  }

  return (
    <AuthCtx.Provider value={{ user, session, ready, isRecoveringPassword, profile, profileLoading, refreshProfile, signUp, signIn, resetPassword, updatePassword, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth(){ return React.useContext(AuthCtx) }
