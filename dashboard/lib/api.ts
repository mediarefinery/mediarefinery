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
