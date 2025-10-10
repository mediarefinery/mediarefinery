import React, { useEffect, useState } from 'react'
import { fetchAuditLogs } from '../lib/api'

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchAuditLogs({ limit: 25 })
      .then((r: any) => setLogs(r.items || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading audit logs…</div>
  if (!logs.length) return <div>No audit logs available.</div>

  return (
    <div>
      <h3>Audit Logs</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.created_at).toLocaleString()}</td>
              <td>{l.actor ?? 'system'}</td>
              <td>{l.action}</td>
              <td>{l.target_type}{l.target_id ? ` #${l.target_id}` : ''}</td>
              <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{JSON.stringify(l.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
