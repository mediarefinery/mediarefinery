import React, { useState } from 'react'
import { triggerBulkAction } from '../lib/api'

export default function BulkActions({ onDone }: { onDone?: () => void }) {
  const [selected, setSelected] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  // for now selection is manual entry (placeholder)
  return (
    <div style={{ marginBottom: 12 }}>
      <label>
        Selected IDs (comma separated):
        <input onChange={(e) => setSelected(e.target.value.split(',').map((s) => Number(s.trim())).filter(Boolean))} style={{ marginLeft: 6 }} />
      </label>
      <button disabled={busy || selected.length === 0} onClick={async () => {
        if (!confirm('Run bulk action on selected IDs?')) return
        setBusy(true)
        try {
          await triggerBulkAction('optimize', selected)
          onDone?.()
        } catch (err) {
          console.error(err)
        } finally { setBusy(false) }
      }} style={{ marginLeft: 8 }}>Optimize selected</button>
    </div>
  )
}
