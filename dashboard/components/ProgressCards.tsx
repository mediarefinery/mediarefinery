import React, { useEffect, useState } from 'react'

type Summary = { optimized: number; skipped: number; bytes_saved: number }

export default function ProgressCards() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchSummary() {
      try {
        const res = await fetch('/dashboard/api/summary-public')
        if (!res.ok) return
        const json = await res.json()
        if (mounted) setSummary(json)
      } catch (e) {
        // ignore for UI
      }
    }

    fetchSummary()
    const id = setInterval(fetchSummary, 5000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const s = summary || { optimized: 0, skipped: 0, bytes_saved: 0 }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      <Card title="Optimized" value={s.optimized} />
      <Card title="Skipped" value={s.skipped} />
      <Card title="Bytes Saved" value={s.bytes_saved} />
    </div>
  )
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div style={{ padding: 12, border: '1px solid #ddd', flex: 1 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ marginTop: 8, fontSize: 20 }}>{value}</p>
    </div>
  )
}
