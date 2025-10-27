import React from 'react'
import { useAuth } from '@api/useAuth'
import {
  listCompanyCustomers,
  searchCompanyCustomers,
  createCustomer,
  updateCustomer,
} from '@api/repo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Customer } from '@api/types'

const emptyCustomer = {
  customer_name: '',
  address: '',
  phone: '',
  email: '',
}

const formatDateShort = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : '—'

export default function CustomersPage() {
  const { profile } = useAuth()
  const companyId = profile?.company_id
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState(emptyCustomer)
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const customersQuery = useQuery({
    queryKey: ['customers', companyId, search],
    queryFn: () =>
      search.trim()
        ? searchCompanyCustomers(companyId!, search)
        : listCompanyCustomers(companyId!),
    enabled: !!companyId,
  })

  const customers = customersQuery.data ?? []

  const mutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      if (!companyId) throw new Error('No company context')
      if (!payload.customer_name.trim() || !payload.address.trim()) {
        throw new Error('Name and address are required.')
      }
      if (editingId) {
        await updateCustomer(editingId, {
          customer_name: payload.customer_name.trim(),
          address: payload.address.trim(),
          phone: payload.phone.trim() || null,
          email: payload.email.trim() || null,
        })
      } else {
        await createCustomer({
          company_id: companyId,
          customer_name: payload.customer_name.trim(),
          address: payload.address.trim(),
          phone: payload.phone.trim() || null,
          email: payload.email.trim() || null,
        })
      }
    },
    onSuccess: () => {
      setStatus('success')
      setErrorMessage(null)
      setEditingId(null)
      setForm(emptyCustomer)
      qc.invalidateQueries({ queryKey: ['customers', companyId] })
    },
    onError: (err) => {
      console.error(err)
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save customer.')
    },
  })

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setForm({
      customer_name: customer.customer_name,
      address: customer.address,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
    })
    setStatus('idle')
    setErrorMessage(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyCustomer)
    setStatus('idle')
    setErrorMessage(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    mutation.mutate(form)
  }

  if (!companyId) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Customers</h2>
        <p>Your profile isn&apos;t linked to a company. Contact an owner for access.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Customers</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Add new customers, update their contact information, and quickly search the list when scheduling work.
      </p>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit customer' : 'Add a new customer'}</h2>
        <form onSubmit={handleSubmit} className="form-grid" style={{ maxWidth: 520 }}>
          <label>Name</label>
          <input
            className="input"
            value={form.customer_name}
            onChange={(event) => setForm((prev) => ({ ...prev, customer_name: event.target.value }))}
            required
          />

          <label>Service address</label>
          <input
            className="input"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            required
          />

          <label>Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="customer@email.com"
          />

          <label>Phone</label>
          <input
            className="input"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="555-555-5555"
          />

          {errorMessage && <div style={{ color: 'var(--danger)' }}>{errorMessage}</div>}
          {status === 'success' && <div style={{ color: 'var(--success)' }}>Customer saved.</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Add customer'}
            </button>
            {editingId && (
              <button className="btn secondary" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <h2 style={{ marginTop: 0 }}>Customer list</h2>
          <input
            className="input"
            style={{ maxWidth: 280 }}
            placeholder="Search by name, address, or email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {customersQuery.isLoading ? (
          <p style={{ color: 'var(--muted)' }}>Loading customers…</p>
        ) : customers.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No customers found. Try adding one above.</p>
        ) : (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{customer.customer_name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>Created {formatDateShort(customer.created_at)}</div>
                  </td>
                  <td>
                    {customer.email && <div>{customer.email}</div>}
                    {customer.phone && <div>{customer.phone}</div>}
                  </td>
                  <td>{customer.address}</td>
                  <td>
                    <button className="btn secondary" type="button" onClick={() => startEdit(customer)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
