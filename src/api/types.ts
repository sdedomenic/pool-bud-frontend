
export type ChemLog = { id: string; job_id: string; ph: string; chlorine_ppm: string; alkalinity: string; taken_at: string }
export type Job = {
  id: string
  company_id: string
  customer_id?: string | null
  customer_name: string
  address: string
  scheduled_at: string
  completed_at?: string | null
  before_url?: string | null
  after_url?: string | null
  technician_id?: string | null
  chem_logs?: ChemLog[]
  created_at?: string
}
export type InventoryItem = { id: string; company_id: string; sku: string; name: string; price_cents: number; qty: number }
export type Customer = {
  id: string
  company_id: string
  customer_name: string
  address: string
  phone?: string | null
  email?: string | null
  balance_due?: number
  created_at?: string
}
