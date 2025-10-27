import React from 'react'

type StatsCardProps = {
  title: string
  value: string
  detail?: string
  tone?: 'default' | 'success' | 'danger'
}

export default function StatsCard({ title, value, detail, tone = 'default' }: StatsCardProps) {
  const toneStyle = tone === 'success'
    ? { color: 'var(--success)' }
    : tone === 'danger'
      ? { color: 'var(--danger)' }
      : undefined

  return (
    <div className="stats-card">
      <div className="stats-card__title">{title}</div>
      <div className="stats-card__value" style={toneStyle}>{value}</div>
      {detail && <div className="stats-card__detail">{detail}</div>}
    </div>
  )
}
