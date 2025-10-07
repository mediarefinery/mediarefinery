// Sampler: select a percentage of items (capped) and verify each URL responds 200
export type SampleItem = { id?: string | number, url: string }

export type VerifyOptions = {
  percent?: number // percent of total to sample (0-100)
  cap?: number // max items to check
  concurrency?: number
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
}

export type VerifyResult = {
  item: SampleItem
  ok: boolean
  status?: number
  attempts: number
  error?: string
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

export function pickSample<T extends SampleItem>(items: T[], percent = 5, cap = 250): T[] {
  if (!items || items.length === 0) return []
  const p = clamp(percent, 0, 100)
  const sampleCount = Math.min(cap, Math.max(1, Math.floor(items.length * (p / 100))))
  // Random sample using Fisher-Yates shuffle: shuffle then take first sampleCount
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
  }
  return arr.slice(0, Math.min(sampleCount, arr.length))
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(url, { method: 'GET', signal: controller.signal })
    return resp
  } finally {
    clearTimeout(id)
  }
}

async function verifyOne(item: SampleItem, opts: Required<VerifyOptions>): Promise<VerifyResult> {
  let attempts = 0
  let lastError: string | undefined
  while (attempts <= opts.retries) {
    attempts++
    try {
      const resp = await fetchWithTimeout(item.url, opts.timeoutMs)
      const ok = resp.status === 200
      return { item, ok, status: resp.status, attempts }
    } catch (err: any) {
      lastError = err?.name === 'AbortError' ? 'timeout' : String(err)
      if (attempts <= opts.retries) {
        await new Promise(r => setTimeout(r, opts.retryDelayMs))
        continue
      }
      return { item, ok: false, attempts, error: lastError }
    }
  }
  return { item, ok: false, attempts, error: lastError }
}

async function runWithConcurrency<T, R>(items: T[], fn: (t: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.max(1, concurrency) }).map(async () => {
    while (true) {
      const idx = i++
      if (idx >= items.length) break
      results[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return results
}

export async function verifySamples(items: SampleItem[], options?: VerifyOptions): Promise<VerifyResult[]> {
  const opts: Required<VerifyOptions> = {
    percent: options?.percent ?? 5,
    cap: options?.cap ?? 250,
    concurrency: options?.concurrency ?? 10,
    timeoutMs: options?.timeoutMs ?? 5000,
    retries: options?.retries ?? 1,
    retryDelayMs: options?.retryDelayMs ?? 200,
  }
  const sample = pickSample(items, opts.percent, opts.cap)
  if (sample.length === 0) return []
  const results = await runWithConcurrency(sample, (it) => verifyOne(it, opts), opts.concurrency)
  return results
}

export default { pickSample, verifySamples }
