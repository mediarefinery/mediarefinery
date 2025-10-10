"use client"

import React, { useEffect, useState } from 'react'

type Settings = {
  enableAvif?: boolean
  qualityProfile?: string
  concurrency?: number
  scheduleStart?: string
  scheduleEnd?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/dashboard/api/settings')
        if (!res.ok) throw new Error('fetch failed')
        const body = await res.json()
        if (!mounted) return
        setSettings(body.config || {})
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/dashboard/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('save failed')
      setMessage('Saved')
    } catch (e: any) {
      setMessage(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading settings…</div>

  return (
    <div>
      <h2>Settings</h2>
      <label>
        <input type="checkbox" checked={!!settings.enableAvif} onChange={(e) => setSettings({ ...settings, enableAvif: e.target.checked })} /> Enable AVIF generation
      </label>
      <div style={{ marginTop: 8 }}>
        <label>
          Quality profile:
          <select value={settings.qualityProfile || 'photographic'} onChange={(e) => setSettings({ ...settings, qualityProfile: e.target.value })} style={{ marginLeft: 6 }}>
            <option value="photographic">photographic</option>
            <option value="graphics">graphics</option>
          </select>
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>
          Concurrency:
          <input type="number" value={settings.concurrency ?? 3} onChange={(e) => setSettings({ ...settings, concurrency: Number(e.target.value) })} style={{ marginLeft: 6, width: 80 }} />
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>
          Schedule start:
          <input type="time" value={settings.scheduleStart || ''} onChange={(e) => setSettings({ ...settings, scheduleStart: e.target.value })} style={{ marginLeft: 6 }} />
        </label>
        <label style={{ marginLeft: 12 }}>
          Schedule end:
          <input type="time" value={settings.scheduleEnd || ''} onChange={(e) => setSettings({ ...settings, scheduleEnd: e.target.value })} style={{ marginLeft: 6 }} />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        {message && <span style={{ marginLeft: 8 }}>{message}</span>}
      </div>
    </div>
  )
}
