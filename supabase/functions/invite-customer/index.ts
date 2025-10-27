import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders } from '../_shared/cors.ts'

type Payload = {
  customerId: string
  email?: string | null
  fullName?: string | null
}

const supabaseUrl = Deno.env.get('APP_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables for invite-customer function.')
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
    if (!payload.customerId) {
      return new Response(JSON.stringify({ error: 'customerId is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!payload.email) {
      return new Response(JSON.stringify({ error: 'Customer email is required to send an invite.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: customer, error: customerError } = await adminClient
      .from('customers')
      .select('id, company_id, portal_user_id, customer_name, email')
      .eq('id', payload.customerId)
      .maybeSingle()

    if (customerError || !customer) {
      return new Response(JSON.stringify({ error: 'Customer not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const email = payload.email.trim().toLowerCase()
    const fullName = payload.fullName?.trim() || customer.customer_name

    // check if user already exists and reuse it
    let authUserId = customer.portal_user_id ?? null
    let invited = false

    if (!authUserId) {
      const list = await adminClient.auth.admin.listUsers()
      const existing = list.data?.users?.find((user) => user.email?.toLowerCase() === email)

      if (existing) {
        authUserId = existing.id
        await adminClient.auth.admin.updateUserById(existing.id, {
          user_metadata: {
            customer_id: customer.id,
            customer_name: fullName,
          },
        })

        const siteUrl = Deno.env.get('SITE_URL')
        await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: siteUrl
              ? `${siteUrl.replace(/\/$/, '')}/customer-setup?customerId=${customer.id}`
              : `${supabaseUrl}/customer-setup?customerId=${customer.id}`,
          },
        })
      } else {
        const invite = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: {
            customer_id: customer.id,
            customer_name: fullName,
          },
          redirectTo:
            (Deno.env.get('SITE_URL')?.replace(/\/$/, '') || supabaseUrl) +
            `/customer-setup?customerId=${customer.id}`,
        })
        if (invite.error) throw invite.error
        authUserId = invite.data?.user?.id ?? null
        invited = true
      }
    } else {
      const siteUrl = Deno.env.get('SITE_URL')
      await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: siteUrl
            ? `${siteUrl.replace(/\/$/, '')}/customer-setup?customerId=${customer.id}`
            : `${supabaseUrl}/customer-setup?customerId=${customer.id}`,
        },
      })
    }

    if (authUserId && authUserId !== customer.portal_user_id) {
      const { error: updateError } = await adminClient
        .from('customers')
        .update({ portal_user_id: authUserId, email })
        .eq('id', customer.id)
      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ customerId: customer.id, invited, portalUserId: authUserId }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('invite-customer error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

