import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders } from '../_shared/cors.ts'

type Payload = {
  companyId?: string
  companyName?: string
  stripeAccountId?: string | null
  owner: {
    email: string
    fullName: string
    phone?: string | null
  }
  /**
   * Optional redirect URL for the invite email (falls back to SITE_URL)
   */
  inviteRedirectUrl?: string
}

const supabaseUrl =
  Deno.env.get('APP_SUPABASE_URL') ??
  Deno.env.get('SUPABASE_URL')
const serviceRoleKey =
  Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const anonKey =
  Deno.env.get('APP_SUPABASE_ANON_KEY') ??
  Deno.env.get('SUPABASE_ANON_KEY')

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure APP_SUPABASE_URL, APP_SUPABASE_ANON_KEY, and APP_SUPABASE_SERVICE_ROLE_KEY are set.',
  )
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function ensureCompany(
  companyId: string | undefined,
  name: string | undefined,
  stripeAccountId: string | null | undefined,
) {
  if (companyId) return companyId
  if (!name) throw new Error('companyName is required when companyId is not provided')
  const { data, error } = await adminClient
    .from('companies')
    .insert({ name, stripe_account_id: stripeAccountId ?? null })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

async function inviteOrFetchUser(email: string, fullName: string, phone?: string | null, redirectTo?: string) {
  const metadata: Record<string, string | null> = {
    full_name: fullName,
    phone: phone ?? null,
  }

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    redirectTo,
  })

  if (!error && data?.user?.id) {
    return { userId: data.user.id, invited: true }
  }

  if (error && (error.message?.includes('already registered') || error.message?.includes('already been registered'))) {
    const list = await adminClient.auth.admin.listUsers()
    const existing = list.data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!existing) throw new Error('User already exists but could not be found by email.')

    await adminClient.auth.admin.updateUserById(existing.id, {
      user_metadata: metadata,
    })

    await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    return { userId: existing.id, invited: false }
  }

  throw error ?? new Error('Unable to invite user')
}

async function upsertOwnerProfile(
  userId: string,
  companyId: string,
  fullName: string,
  email: string,
  phone?: string | null,
) {
  const { error: demoteError } = await adminClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('company_id', companyId)
    .eq('role', 'owner')
    .neq('id', userId)
  if (demoteError) throw demoteError

  const { error } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      company_id: companyId,
      role: 'owner',
      full_name: fullName,
      email,
      phone: phone ?? null,
      has_completed_setup: false,
    })
  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: requesterProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (requesterProfile?.role !== 'platform_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = (await req.json()) as Payload
    if (!payload.owner?.email || !payload.owner?.fullName) {
      return new Response(JSON.stringify({ error: 'Missing owner.email or owner.fullName' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const companyId = await ensureCompany(
      payload.companyId,
      payload.companyName,
      payload.stripeAccountId ?? null,
    )

    const siteUrl = Deno.env.get('SITE_URL')
    const redirectTo =
      payload.inviteRedirectUrl ||
      (siteUrl ? `${siteUrl.replace(/\/$/, '')}/welcome` : `${supabaseUrl}/welcome`)

    const { userId, invited } = await inviteOrFetchUser(
      payload.owner.email,
      payload.owner.fullName,
      payload.owner.phone ?? null,
      redirectTo,
    )

    await upsertOwnerProfile(
      userId,
      companyId,
      payload.owner.fullName,
      payload.owner.email,
      payload.owner.phone,
    )

    return new Response(
      JSON.stringify({
        companyId,
        userId,
        invited,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('invite-owner error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
