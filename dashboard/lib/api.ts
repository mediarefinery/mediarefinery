import { apiFetch } from './fetchClient'

export async function fetchSummary() {
  return apiFetch('/dashboard/api/summary')
}

export async function fetchImages(page = 1) {
  return apiFetch(`/dashboard/api/images?page=${page}`)
}

export async function triggerDryRun() {
  return apiFetch('/dashboard/api/dry-run', { method: 'POST' })
}

export async function triggerOptimize() {
  return apiFetch('/dashboard/api/optimize', { method: 'POST' })
}

export async function triggerRollback() {
  return apiFetch('/dashboard/api/rollback', { method: 'POST' })
}

export async function triggerBulkAction(action: string, ids: number[]) {
  return apiFetch('/dashboard/api/bulk-actions', { method: 'POST', body: JSON.stringify({ action, ids }), headers: { 'Content-Type': 'application/json' } })
}

export async function fetchAuditLogs(params: { limit?: number; cursor?: number; action?: string; since?: string } = {}) {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.cursor) qs.set('cursor', String(params.cursor))
  if (params.action) qs.set('action', params.action)
  if (params.since) qs.set('since', params.since)
  const path = `/dashboard/api/audit-logs?${qs.toString()}`
  return apiFetch(path)
}
