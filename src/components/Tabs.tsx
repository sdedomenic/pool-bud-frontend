import React from "react"

type Tab = {
  id: string
  label: string
  content: React.ReactNode
}

export default function Tabs({ tabs, initial = 0 }: { tabs: Tab[]; initial?: number }) {
  const [active, setActive] = React.useState(initial)
  return (
    <div>
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActive(i)}
            className="tab-btn"
            aria-selected={active === i}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: 16 }}>{tabs[active].content}</div>
    </div>
  )
}
