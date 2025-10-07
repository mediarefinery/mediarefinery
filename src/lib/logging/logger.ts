// Lightweight structured JSON logger with redaction
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const DEFAULT_REDACT_KEYS = ['authorization', 'password', 'token', 'apikey', 'apiKey', 'secret', 'credentials']

function getLogLevelPriority(level: LogLevel) {
  switch (level) {
    case 'debug': return 10
    case 'info': return 20
    case 'warn': return 30
    case 'error': return 40
  }
}

const envLevel = (process.env.LOG_LEVEL || 'info') as LogLevel
let CURRENT_LEVEL_PRIORITY = getLogLevelPriority(envLevel) ?? 20

let redactKeys = new Set(DEFAULT_REDACT_KEYS.map(k => k.toLowerCase()))

export function setRedactKeys(keys: string[]) {
  redactKeys = new Set(keys.map(k => k.toLowerCase()))
}

function isObject(o: any) {
  return o && typeof o === 'object'
}

// Deep copy with redaction; safe for circular refs
export function redact(input: any, extraKeys?: string[]): any {
  const seen = new WeakSet()
  const keysSet = new Set<string>([...Array.from(redactKeys)])
  if (Array.isArray(extraKeys)) {
    for (const k of extraKeys) keysSet.add(k.toLowerCase())
  }

  function _rec(v: any): any {
    if (!isObject(v)) return v
    if (v instanceof Date) return v.toISOString()
    if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack }
    if (seen.has(v)) return '[Circular]'
    seen.add(v)
    if (Array.isArray(v)) return v.map(_rec)
    const out: Record<string, any> = {}
    for (const [k, val] of Object.entries(v)) {
      try {
        if (keysSet.has(k.toLowerCase())) {
          out[k] = '<REDACTED>'
        } else {
          out[k] = _rec(val)
        }
      } catch (e) {
        out[k] = `[Error serializing: ${String(e)}]`
      }
    }
    return out
  }

  try {
    return _rec(input)
  } catch (e) {
    return { __redaction_error: String(e) }
  }
}

function shouldLog(level: LogLevel) {
  const pr = getLogLevelPriority(level) ?? 20
  return pr >= CURRENT_LEVEL_PRIORITY
}

function log(level: LogLevel, message: string, context?: any) {
  try {
    const payload: any = {
      ts: new Date().toISOString(),
      level,
      message,
    }
    if (context !== undefined) payload.context = redact(context)
    const line = JSON.stringify(payload)
    // Write to stdout so logs can be captured as JSON lines
    console.log(line)
  } catch (e) {
    // Fallback: minimal console output
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'error', message: 'logger failure', err: String(e) }))
  }
}

export const logger = {
  debug: (msg: string, ctx?: any) => { if (shouldLog('debug')) log('debug', msg, ctx) },
  info:  (msg: string, ctx?: any) => { if (shouldLog('info'))  log('info',  msg, ctx) },
  warn:  (msg: string, ctx?: any) => { if (shouldLog('warn'))  log('warn',  msg, ctx) },
  error: (msg: string, ctx?: any) => { if (shouldLog('error')) log('error', msg, ctx) },
  setLevel: (lvl: LogLevel) => { CURRENT_LEVEL_PRIORITY = getLogLevelPriority(lvl) ?? 20 },
  setRedactKeys,
}

export default logger
