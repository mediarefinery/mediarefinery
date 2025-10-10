"use client"
import React, { useState } from 'react'
import ProgressCards from '../components/ProgressCards'
import dynamic from 'next/dynamic'
import { triggerDryRun, triggerOptimize, triggerRollback } from '../lib/api'

const ImageTable = dynamic(() => import('../components/ImageTable'), { ssr: false });

export default function Page() {
  const [opMessage, setOpMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function doOp(fn: () => Promise<any>, label: string) {
    if (!confirm(`Are you sure you want to ${label}?`)) return
    setBusy(true)
    setOpMessage(null)
    try {
      const res = await fn()
      setOpMessage(`${label} queued: ${res?.jobId ?? 'ok'}`)
    } catch (e: any) {
      setOpMessage(`${label} failed: ${String(e?.message || e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <ProgressCards />
      <section>
        <h2>Operations</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button disabled={busy} onClick={() => doOp(() => triggerDryRun(), 'Trigger dry-run')}>Trigger dry-run</button>
          <button disabled={busy} onClick={() => doOp(() => triggerOptimize(), 'Start optimize')}>Start optimize</button>
          <button disabled={busy} onClick={() => doOp(() => triggerRollback(), 'Start rollback')}>Start rollback</button>
        </div>
        {opMessage && <div><strong>{opMessage}</strong></div>}
      </section>
      <section>
        <h2>Recent Activity</h2>
        <p>Placeholder for recent runs and summaries.</p>
      </section>
      <section>
        <ImageTable />
      </section>
    </div>
  )
}
