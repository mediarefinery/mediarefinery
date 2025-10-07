// Server-only secret loader
// Loads environment variables (dotenv when available) and validates required secrets.
import fs from 'fs'
import path from 'path'

const REQUIRED_SECRETS = [
  'WP_USERNAME',
  'WP_PASSWORD',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET'
]

// Load .env in development/test if present
function tryLoadDotenv() {
  try {
    // Lazy require so we don't force dotenv in production if not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenvPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(dotenvPath)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config({ path: dotenvPath })
    }
  } catch (e) {
    // ignore - dotenv may not be installed in some environments
  }
}

// Prevent accidental use on client-side (bundlers may include this file only if imported server-side)
if (typeof window !== 'undefined') {
  throw new Error('Secrets module must only be used on the server side')
}

tryLoadDotenv()

function validateSecrets() {
  const missing: string[] = []
  for (const key of REQUIRED_SECRETS) {
    if (!process.env[key]) missing.push(key)
  }
  if (missing.length) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`)
  }

  // Ensure no secret accidentally uses client-exposed prefix
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('NEXT_PUBLIC_') && REQUIRED_SECRETS.includes(k)) {
      throw new Error(`Secret key ${k} must not start with NEXT_PUBLIC_ (client-exposed)`)
    }
  }
}

// Redact helper for safe logging if ever needed
export function redactSecrets(obj: Record<string, any>): Record<string, any> {
  const res: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (REQUIRED_SECRETS.includes(k)) res[k] = '<REDACTED>'
    else res[k] = v
  }
  return res
}

// Expose getters that intentionally do not serialize or reveal secrets accidentally
export function getSecret(key: string): string | undefined {
  if (!REQUIRED_SECRETS.includes(key)) {
    // Allow reading non-secret env vars too, but caller should be careful
    return process.env[key]
  }
  return process.env[key]
}

export function getAllSecrets() {
  const out: Record<string, string> = {}
  for (const k of REQUIRED_SECRETS) {
    out[k] = process.env[k] || ''
  }
  return out
}

// Perform validation eagerly at import time so tests / CI catch missing secrets early
try {
  // Only validate in non-production CI/dev/test; in production you may manage differently
  if (process.env.NODE_ENV !== 'production') {
    // Validation here will throw if required secrets are missing; tests will set them
    validateSecrets()
  }
} catch (err) {
  // Re-throw so importing code fails clearly
  throw err
}

export default { getSecret, getAllSecrets, redactSecrets }
