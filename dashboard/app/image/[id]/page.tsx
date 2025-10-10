"use client"

import React, { useEffect, useState } from 'react'

type Inventory = {
  id: number
  attachment_url: string
  filename?: string | null
  mime_type?: string | null
  file_size_bytes?: number | null
  status?: string | null
  discovered_at?: string | null
  metadata?: Record<string, any> | null
}

type Optimization = {
  id: number
  inventory_id: number
  optimized_url: string
  filename?: string | null
  mime_type?: string | null
  file_size_bytes?: number | null
  format?: string | null
  created_at?: string | null
}

export default function ImagePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [optimizations, setOptimizations] = useState<Optimization[]>([])
  const [bytesSaved, setBytesSaved] = useState<number | null>(null)
  const [reductionPct, setReductionPct] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/dashboard/api/images/${params.id}`)
        if (!res.ok) throw new Error(`fetch failed ${res.status}`)
  const body = await res.json()
  if (!mounted) return
  setInventory(body.inventory || null)
  setOptimizations(body.optimizations || [])
  setBytesSaved(typeof body.bytes_saved === 'number' ? body.bytes_saved : null)
  setReductionPct(typeof body.reduction_pct === 'number' ? body.reduction_pct : null)
      } catch (e: any) {
        if (!mounted) return
        setError(String(e?.message || e))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [params.id])

  if (loading) return <div>Loading image {params.id}…</div>
  if (error) return <div>Error: {error}</div>
  if (!inventory) return <div>Image not found</div>

  return (
    <div>
      <h2>Image {inventory.id}</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 320 }}>
          <p><strong>Filename:</strong> {inventory.filename || '-'}</p>
          <p><strong>Attachment URL:</strong> <a href={inventory.attachment_url} target="_blank" rel="noreferrer">{inventory.attachment_url}</a></p>
          <p><strong>Mime:</strong> {inventory.mime_type || '-'}</p>
          <p><strong>Size:</strong> {inventory.file_size_bytes ?? '-'} bytes</p>
          <p><strong>Bytes saved (best):</strong> {bytesSaved ?? '-'} </p>
          <p><strong>Reduction:</strong> {reductionPct !== null ? `${reductionPct}%` : '-'}</p>
          <p><strong>Status:</strong> {inventory.status || '-'}</p>
          <p><strong>Discovered:</strong> {inventory.discovered_at || '-'}</p>
          {inventory.metadata && (
            <div style={{ marginTop: 8 }}>
              <strong>Metadata</strong>
              <ul>
                {Object.entries(inventory.metadata).map(([k, v]) => (
                  <li key={k}><strong>{k}:</strong> {String(v)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          <strong>Preview</strong>
          <div style={{ marginTop: 8 }}>
            <img src={inventory.attachment_url} alt={String(inventory.filename || '')} style={{ maxWidth: 360, maxHeight: 360, objectFit: 'contain', border: '1px solid #eee' }} />
          </div>
          {optimizations.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Optimization thumbnails</strong>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {optimizations.map((o) => (
                  <a key={o.id} href={o.optimized_url} target="_blank" rel="noreferrer">
                    <img src={o.optimized_url} alt={o.filename || ''} style={{ width: 96, height: 96, objectFit: 'cover', border: '1px solid #eee' }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3>Optimizations</h3>
        {optimizations.length === 0 ? (
          <p>No optimizations recorded</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>ID</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Filename</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Format</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Size</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {optimizations.map((o) => (
                <tr key={o.id}>
                  <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{o.id}</td>
                  <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}><a href={o.optimized_url} target="_blank" rel="noreferrer">{o.filename || o.optimized_url}</a></td>
                  <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{o.format || o.mime_type || '-'}</td>
                  <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{o.file_size_bytes ?? '-'}</td>
                  <td style={{ padding: '6px 4px', borderBottom: '1px solid #eee' }}>{o.created_at || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
