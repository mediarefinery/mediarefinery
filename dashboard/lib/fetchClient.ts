export class ApiError extends Error {
  status: number
  body: any
  constructor(message: string, status = 500, body: any = null) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function apiFetch(path: string, opts: RequestInit = {}, timeoutMs = 10000) {
  const url = path.startsWith('/') ? path : `/dashboard/api/${path}`
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const fetchPromise = fetch(url, { ...opts, signal: controller.signal })
    const abortPromise = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(new ApiError('Request timeout', 408, null)))
    })
    const res: any = await Promise.race([fetchPromise, abortPromise])
    clearTimeout(id)
    if (!res.ok) {
      let body = null
      try { body = await (typeof res.json === 'function' ? res.json() : res.text()) } catch (_) { body = await (res.text?.() ?? null) }
      throw new ApiError(`Request failed: ${res.statusText}`, res.status, body)
    }
    // Prefer json() when available (common in fetch mocks), otherwise fall back to text()
    if (typeof res.json === 'function') return res.json()
    if (typeof res.text === 'function') {
      const txt = await res.text()
      try { return JSON.parse(txt) } catch (_) { return txt }
    }
    return null
  } catch (err: any) {
    if (err instanceof ApiError) throw err
    throw new ApiError(err?.message || String(err), 500, null)
  }
}
