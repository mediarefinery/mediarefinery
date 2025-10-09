import React, { useEffect, useState } from 'react'

export default function ProgressCards() {
  const [summary, setSummary] = useState<{ optimized: number; skipped: number; bytes_saved: number } | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchSummary() {
      try {
        const res = await fetch('/dashboard/api/summary-public')
        if (!res.ok) return
        const json = await res.json()
        if (mounted) setSummary(json)
      } catch (e) {
        // ignore
      }
    }

    fetchSummary()
    const id = setInterval(fetchSummary, 5000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  if (!summary) return <div>Loading metrics...</div>

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ padding: 12, border: '1px solid #ddd' }}>
        <h3>Optimized</h3>
        <div>{summary.optimized}</div>
      </div>
      <div style={{ padding: 12, border: '1px solid #ddd' }}>
        <h3>Skipped</h3>
        <div>{summary.skipped}</div>
      </div>
      <div style={{ padding: 12, border: '1px solid #ddd' }}>
        <h3>Bytes saved</h3>
        <div>{summary.bytes_saved}</div>
      </div>
    </div>
  )
}
import React from 'react';

export default function ProgressCards() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      <div style={{ padding: 12, border: '1px solid #ddd', flex: 1 }}>
        <h3>Optimized</h3>
        <p>0</p>
      </div>
      <div style={{ padding: 12, border: '1px solid #ddd', flex: 1 }}>
        <h3>Skipped</h3>
        <p>0</p>
      </div>
      <div style={{ padding: 12, border: '1px solid #ddd', flex: 1 }}>
        <h3>Bytes Saved</h3>
        <p>0</p>
      </div>
    </div>
  );
}
