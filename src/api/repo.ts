
import { supabase } from './supabaseClient'
import type { Job, InventoryItem, Customer } from './types'

export async function listJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, chem_logs(*)')
    .order('scheduled_at', { ascending: true })
    .limit(50)
  if(error) throw error
  return data as unknown as Job[]
}

export async function getJob(id: string): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, chem_logs(*)')
    .eq('id', id)
    .single()
  if(error) throw error
  return data as unknown as Job
}

export async function completeJob(id: string): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
  if(error) throw error
}

export async function uploadPhoto(id: string, kind: 'before'|'after', file: File): Promise<void> {
  const bucket = 'photos'
  const filename = `${id}/${kind}-${Date.now()}-${file.name}`
  const { data: up, error: upErr } = await supabase.storage.from(bucket).upload(filename, file, { upsert: true })
  if(upErr) throw upErr
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(up.path)
  const url = urlData.publicUrl
  const field = kind === 'before' ? 'before_url' : 'after_url'
  const { error } = await supabase.from('jobs').update({ [field]: url }).eq('id', id)
  if(error) throw error
}

export async function addChemicalReading(id: string, payload: {pH:string, chlorine:string, alkalinity:string}): Promise<void> {
  const { error } = await supabase.from('chem_logs').insert({
    job_id: id,
    ph: payload.pH,
    chlorine_ppm: payload.chlorine,
    alkalinity: payload.alkalinity,
    taken_at: new Date().toISOString()
  })
  if(error) throw error
}

export async function searchInventory(q: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  if(error) throw error
  return data as unknown as InventoryItem[]
}

export async function getCustomerView(customerId: string){
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()
  if (custErr) throw custErr

  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select(
      `id, company_id, customer_id, customer_name, address, scheduled_at, completed_at, before_url, after_url, technician_id, created_at,
        technician:profiles!jobs_technician_id_fkey(id, full_name, phone),
        chem_logs(*, taken_at, ph, chlorine_ppm, alkalinity)`
    )
    .eq('customer_id', customerId)
    .order('scheduled_at', { ascending: false })
  if (jobsErr) throw jobsErr

  const sortedChemLogs = (jobs ?? [])
    .flatMap((job: any) => job.chem_logs ?? [])
    .sort((a: any, b: any) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())

  const upcomingVisit = (jobs ?? [])
    .filter((job: any) => !job.completed_at && new Date(job.scheduled_at) >= new Date())
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null

  const latestChem = sortedChemLogs[0] ?? null

  return {
    customer,
    visits: jobs ?? [],
    chemLogs: sortedChemLogs,
    latestChem,
    upcomingVisit,
  }
}

export type Company = {
  id: string
  name: string
  stripe_account_id: string | null
  created_at: string
}

export type ProfileSummary = {
  id: string
  role: 'platform_admin' | 'owner' | 'admin' | 'dispatcher' | 'tech'
  company_id: string | null
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

export async function listCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, stripe_account_id, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Company[]
}

export async function createCompany(payload: { name: string; stripe_account_id?: string | null }): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: payload.name,
      stripe_account_id: payload.stripe_account_id ?? null,
    })
    .select('id, name, stripe_account_id, created_at')
    .single()
  if (error) throw error
  return data as Company
}

export async function createJob(payload: {
  company_id: string
  customer_name: string
  address: string
  scheduled_at: string
  technician_id?: string | null
  customer_id?: string | null
}): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: payload.company_id,
      customer_name: payload.customer_name,
      address: payload.address,
      scheduled_at: payload.scheduled_at,
      customer_id: payload.customer_id ?? null,
      technician_id: payload.technician_id ?? null,
    })
    .select('*, chem_logs(*)')
    .single()
  if (error) throw error
  return data as unknown as Job
}

export async function updateCompany(id: string, updates: { name?: string; stripe_account_id?: string | null }): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.stripe_account_id !== undefined ? { stripe_account_id: updates.stripe_account_id } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, company_id, full_name, email, phone, address_line1, address_line2, city, state, postal_code, country, has_completed_setup')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    role: row.role as ProfileSummary['role'],
    company_id: row.company_id as string | null,
    full_name: row.full_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address_line1: row.address_line1 ?? null,
    address_line2: row.address_line2 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postal_code: row.postal_code ?? null,
    country: row.country ?? null,
    has_completed_setup: !!row.has_completed_setup,
  }))
}

export async function listCompanyProfiles(companyId: string): Promise<ProfileSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, company_id, full_name, email, phone, address_line1, address_line2, city, state, postal_code, country, has_completed_setup')
    .eq('company_id', companyId)
    .order('role', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    role: row.role as ProfileSummary['role'],
    company_id: row.company_id as string | null,
    full_name: row.full_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address_line1: row.address_line1 ?? null,
    address_line2: row.address_line2 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postal_code: row.postal_code ?? null,
    country: row.country ?? null,
    has_completed_setup: !!row.has_completed_setup,
  }))
}

export async function listCompanyJobs(companyId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, chem_logs(*)')
    .eq('company_id', companyId)
    .order('scheduled_at', { ascending: true })
    .limit(200)
  if (error) throw error
  return data as unknown as Job[]
}

export async function listCompanyInventory(companyId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true })
    .limit(200)
  if (error) throw error
  return data as unknown as InventoryItem[]
}

export async function listTechnicianJobs(profileId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, chem_logs(*)')
    .eq('technician_id', profileId)
    .order('scheduled_at', { ascending: true })
    .limit(100)
  if (error) throw error
  return data as unknown as Job[]
}

export async function updateJobAssignment(
  jobId: string,
  updates: { technician_id?: string | null; scheduled_at?: string | null }
): Promise<void> {
  const payload: Record<string, string | null> = {}
  if ('technician_id' in updates) {
    payload.technician_id = updates.technician_id ?? null
  }
  if ('scheduled_at' in updates) {
    payload.scheduled_at = updates.scheduled_at ?? null
  }

  const { error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
  if (error) throw error
}

export async function assignOwnerToCompany(companyId: string, profileId: string): Promise<void> {
  const { error: demoteError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('company_id', companyId)
    .eq('role', 'owner')
    .neq('id', profileId)
  if (demoteError) throw demoteError

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'owner', company_id: companyId })
    .eq('id', profileId)
  if (error) throw error
}

export type ProfileUpdateInput = {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  has_completed_setup?: boolean
}

export async function updateProfileContactInfo(profileId: string, updates: ProfileUpdateInput): Promise<void> {
  const payload: Record<string, string | boolean | null> = {}
  ;([
    'full_name',
    'email',
    'phone',
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
  ] as const).forEach((key) => {
    if (key in updates) {
      payload[key] = updates[key] ?? null
    }
  })

  if (typeof updates.has_completed_setup === 'boolean') {
    payload.has_completed_setup = updates.has_completed_setup
  }

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profileId)
  if (error) throw error
}

export async function listCompanyCustomers(companyId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, company_id, customer_name, address, phone, email, balance_due, created_at')
    .eq('company_id', companyId)
    .order('customer_name', { ascending: true })
  if (error) throw error
  return data as Customer[]
}

export async function searchCompanyCustomers(companyId: string, query: string): Promise<Customer[]> {
  const normalized = query.trim()
  if (!normalized) return listCompanyCustomers(companyId)
  const { data, error } = await supabase
    .from('customers')
    .select('id, company_id, customer_name, address, phone, email, balance_due, created_at')
    .eq('company_id', companyId)
    .or(`customer_name.ilike.%${normalized}%,address.ilike.%${normalized}%,email.ilike.%${normalized}%`)
    .order('customer_name', { ascending: true })
  if (error) throw error
  return data as Customer[]
}

export async function createCustomer(payload: {
  company_id: string
  customer_name: string
  address: string
  phone?: string | null
  email?: string | null
}): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      company_id: payload.company_id,
      customer_name: payload.customer_name,
      address: payload.address,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
    })
    .select('id, company_id, customer_name, address, phone, email, balance_due, created_at')
    .single()
  if (error) throw error
  const customer = data as Customer

  if (payload.email?.trim()) {
    try {
      await supabase.functions.invoke('invite-customer', {
        body: {
          customerId: customer.id,
          email: payload.email,
          fullName: payload.customer_name,
        },
      })
    } catch (inviteError) {
      console.error('invite-customer error', inviteError)
    }
  }

  return customer
}

export async function updateCustomer(customerId: string, updates: {
  customer_name?: string
  address?: string
  phone?: string | null
  email?: string | null
}): Promise<void> {
  const payload: Record<string, string | null> = {}
  if ('customer_name' in updates && updates.customer_name !== undefined) payload.customer_name = updates.customer_name
  if ('address' in updates && updates.address !== undefined) payload.address = updates.address
  if ('phone' in updates) payload.phone = updates.phone ?? null
  if ('email' in updates) payload.email = updates.email ?? null

  const { error } = await supabase
    .from('customers')
    .update(payload)
    .eq('id', customerId)
  if (error) throw error
}
