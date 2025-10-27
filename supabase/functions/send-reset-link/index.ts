import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders } from '../_shared/cors.ts'

type Payload = {
  email: string
}

const supabaseUrl = Deno.env.get('APP_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables for send-reset-link function.')
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as Payload
    const email = payload.email?.trim().toLowerCase()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Valid email is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersError) throw usersError

    const match = users?.users?.find((user) => user.email?.toLowerCase() === email)
    if (!match) {
      return new Response(JSON.stringify({ status: 'not_found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const siteUrl = Deno.env.get('SITE_URL')?.replace(/\/$/, '') || supabaseUrl
    let redirectTo = `${siteUrl}/reset-password`

    const customerId = match.user_metadata?.customer_id as string | undefined
    if (customerId) {
      redirectTo = `${siteUrl}/customer-setup?customerId=${customerId}`
    } else {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('has_completed_setup')
        .eq('id', match.id)
        .maybeSingle()
      if (!profile?.has_completed_setup) {
        redirectTo = `${siteUrl}/welcome`
      }
    }

    const { error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })
    if (linkError) throw linkError

    return new Response(JSON.stringify({ status: 'sent', redirectTo }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-reset-link error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

