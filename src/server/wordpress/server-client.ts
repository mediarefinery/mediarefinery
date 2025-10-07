import { getSecret } from '../../lib/secrets'

// Server-only guard
if (typeof window !== 'undefined') {
  throw new Error('server-client must only be used on the server')
}

const WP_BASE = process.env.WP_BASE_URL || ''

function getAuthHeader() {
  const user = getSecret('WP_USERNAME')
  const pass = getSecret('WP_PASSWORD')
  if (!user || !pass) throw new Error('WordPress credentials are missing')
  const token = Buffer.from(`${user}:${pass}`).toString('base64')
  return `Basic ${token}`
}

export async function wpGet(path: string) {
  const url = `${WP_BASE}${path}`
  const headers: Record<string, string> = { Authorization: getAuthHeader() }
  const resp = await fetch(url, { method: 'GET', headers })
  return resp
}

export async function wpPost(path: string, body: any) {
  const url = `${WP_BASE}${path}`
  const headers: Record<string, string> = { Authorization: getAuthHeader(), 'Content-Type': 'application/json' }
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  return resp
}

export default { wpGet, wpPost }
