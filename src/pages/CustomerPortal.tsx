import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import StatsCard from '@components/StatsCard'
import { getCustomerView } from '@api/repo'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'

const formatDateShort = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : '—'

const ChemistryTable: React.FC<{ readings: any[] }> = ({ readings }) => {
  if (!readings.length) return <p style={{ color: 'var(--muted)' }}>No chemistry readings yet.</p>
  return (
    <table className="table" style={{ marginTop: 12 }}>
      <thead>
        <tr>
          <th>Date</th>
          <th>pH</th>
          <th>Chlorine (ppm)</th>
          <th>Alkalinity</th>
        </tr>
      </thead>
      <tbody>
        {readings.slice(0, 12).map((log) => (
          <tr key={log.id}>
            <td>{formatDate(log.taken_at)}</td>
            <td>{log.ph ?? '—'}</td>
            <td>{log.chlorine_ppm ?? '—'}</td>
            <td>{log.alkalinity ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function CustomerPortal() {
  const { customerId } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['cust', customerId],
    queryFn: () => getCustomerView(customerId!),
    enabled: !!customerId,
  })

  if (isLoading || !data) return <div className="container">Loading…</div>

  const { customer, visits, chemLogs, latestChem, upcomingVisit } = data as any

  const completedVisits = visits.filter((visit: any) => !!visit.completed_at)
  const outstandingBalance = customer?.balance_due ?? 0

  return (
    <div className="container" style={{ maxWidth: 980, paddingBottom: 48 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>{customer.customer_name}</h1>
        <div style={{ color: 'var(--muted)' }}>{customer.address}</div>
        {customer.phone && <div style={{ color: 'var(--muted)' }}>{customer.phone}</div>}
      </header>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatsCard
          title="Next visit"
          value={upcomingVisit ? formatDate(upcomingVisit.scheduled_at) : 'No visit scheduled'}
          detail={upcomingVisit?.technician?.full_name ? `Technician: ${upcomingVisit.technician.full_name}` : ''}
        />
        <StatsCard
          title="Completed visits"
          value={completedVisits.length.toString()}
          detail={visits.length ? `${visits.length} visits recorded` : 'No visits yet'}
          tone={completedVisits.length ? 'success' : 'default'}
        />
        <StatsCard
          title="Latest chemistry"
          value={latestChem ? `pH ${latestChem.ph}` : 'No readings'}
          detail={latestChem ? `Cl ${latestChem.chlorine_ppm} · Alk ${latestChem.alkalinity}` : ''}
        />
        <StatsCard
          title="Balance due"
          value={currency.format(outstandingBalance / 100)}
          detail={outstandingBalance ? 'Online payments coming soon' : 'All settled'}
          tone={outstandingBalance ? 'danger' : 'success'}
        />
      </div>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Visit history</h2>
        {!visits.length ? (
          <p style={{ color: 'var(--muted)' }}>No visits yet.</p>
        ) : (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit: any) => (
                <tr key={visit.id}>
                  <td>{formatDate(visit.scheduled_at)}</td>
                  <td>{visit.completed_at ? 'Completed' : 'Scheduled'}</td>
                  <td>{visit.technician?.full_name ?? '—'}</td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{visit.address}</div>
                    {visit.chem_logs?.length ? (
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        Last chemistry: pH {visit.chem_logs[0].ph}, Cl {visit.chem_logs[0].chlorine_ppm}, Alk {visit.chem_logs[0].alkalinity}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                      {visit.before_url && (
                        <a className="btn secondary" href={visit.before_url} target="_blank" rel="noreferrer">
                          Before photo
                        </a>
                      )}
                      {visit.after_url && (
                        <a className="btn secondary" href={visit.after_url} target="_blank" rel="noreferrer">
                          After photo
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Chemistry readings</h2>
        <ChemistryTable readings={chemLogs} />
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Photo gallery</h2>
        {visits.some((visit: any) => visit.before_url || visit.after_url) ? (
          <div className="grid cols-2" style={{ gap: 16 }}>
            {visits.map((visit: any) => (
              <React.Fragment key={visit.id}>
                {visit.before_url && (
                  <figure className="card" style={{ padding: 12 }}>
                    <img
                      src={visit.before_url}
                      alt={`Before service ${formatDateShort(visit.scheduled_at)}`}
                      style={{ width: '100%', borderRadius: 12 }}
                    />
                    <figcaption style={{ marginTop: 8, fontSize: 13 }}>Before • {formatDateShort(visit.scheduled_at)}</figcaption>
                  </figure>
                )}
                {visit.after_url && (
                  <figure className="card" style={{ padding: 12 }}>
                    <img
                      src={visit.after_url}
                      alt={`After service ${formatDateShort(visit.completed_at ?? visit.scheduled_at)}`}
                      style={{ width: '100%', borderRadius: 12 }}
                    />
                    <figcaption style={{ marginTop: 8, fontSize: 13 }}>After • {formatDateShort(visit.completed_at ?? visit.scheduled_at)}</figcaption>
                  </figure>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)' }}>No photos uploaded yet.</p>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Invoices & Payments</h2>
        <p style={{ color: 'var(--muted)' }}>
          Online payments are coming soon. For now, please contact your service provider to settle any outstanding balance.
        </p>
        <button className="btn" type="button" disabled>
          Pay Invoice (coming soon)
        </button>
      </section>
    </div>
  )
}

