import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders } from '../_shared/cors.ts'

type Payload = {
  companyId?: string
  role: 'admin' | 'dispatcher' | 'tech'
  email: string
  fullName: string
  phone?: string | null
  inviteRedirectUrl?: string
}

const supabaseUrl = Deno.env.get('APP_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const anonKey = Deno.env.get('APP_SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('Missing Supabase environment variables for invite-team-member function.')
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ALLOWED_ROLES = new Set(['admin', 'dispatcher', 'tech'])
const ADMIN_ALLOWED = new Set(['dispatcher', 'tech'])

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

    await adminClient.auth.admin.updateUserById(existing.id, { user_metadata: metadata })
    await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    return { userId: existing.id, invited: false }
  }

  throw error ?? new Error('Unable to invite user')
}

async function upsertTeamMemberProfile(
  userId: string,
  companyId: string,
  role: Payload['role'],
  fullName: string,
  email: string,
  phone?: string | null,
) {
  const { error } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      company_id: companyId,
      role,
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

    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const requesterId = authData.user.id

    const { data: requesterProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, company_id')
      .eq('id', requesterId)
      .maybeSingle()

    if (profileError || !requesterProfile) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = (await req.json()) as Payload
    if (!ALLOWED_ROLES.has(payload.role)) {
      return new Response(JSON.stringify({ error: 'Invalid role supplied.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!payload.email || !payload.fullName) {
      return new Response(JSON.stringify({ error: 'Email and fullName are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let companyId = payload.companyId
    if (requesterProfile.role === 'platform_admin') {
      if (!companyId) {
        return new Response(JSON.stringify({ error: 'companyId is required for platform admins.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      if (!requesterProfile.company_id) {
        return new Response(JSON.stringify({ error: 'Requester is not associated with a company.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      companyId = requesterProfile.company_id
      if (requesterProfile.role === 'admin' && !ADMIN_ALLOWED.has(payload.role)) {
        return new Response(JSON.stringify({ error: 'Admins may invite dispatchers and technicians only.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (requesterProfile.role === 'owner' && !ALLOWED_ROLES.has(payload.role)) {
        return new Response(JSON.stringify({ error: 'Owners may invite admins, dispatchers, or technicians.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!['owner', 'admin'].includes(requesterProfile.role)) {
        return new Response(JSON.stringify({ error: 'You do not have permission to invite teammates.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Company context missing.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const siteUrl = Deno.env.get('SITE_URL')
    const redirectTo =
      payload.inviteRedirectUrl ||
      (siteUrl ? `${siteUrl.replace(/\/$/, '')}/welcome` : `${supabaseUrl}/welcome`)

    const { userId, invited } = await inviteOrFetchUser(
      payload.email.trim(),
      payload.fullName.trim(),
      payload.phone ?? null,
      redirectTo,
    )

    await upsertTeamMemberProfile(
      userId,
      companyId,
      payload.role,
      payload.fullName.trim(),
      payload.email.trim(),
      payload.phone ?? null,
    )

    return new Response(
      JSON.stringify({ userId, companyId, invited }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('invite-team-member error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
