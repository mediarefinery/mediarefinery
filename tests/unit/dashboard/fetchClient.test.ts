import { apiFetch, ApiError } from '../../../dashboard/lib/fetchClient'

describe('apiFetch', () => {
  const globalAny: any = global

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    delete globalAny.fetch
  })

  test('parses json success', async () => {
    globalAny.fetch = jest.fn(() => Promise.resolve({ ok: true, text: async () => JSON.stringify({ a: 1 }) }))
    const v = await apiFetch('/dashboard/api/summary')
    expect(v.a).toBe(1)
  })

  test('throws ApiError for non-ok', async () => {
    globalAny.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 400, statusText: 'Bad', json: async () => ({ error: 'x' }), text: async () => '' }))
    await expect(apiFetch('/dashboard/api/bad')).rejects.toBeInstanceOf(ApiError)
  })

  test('throws timeout', async () => {
    // Mock fetch that resolves after a long delay
    let resolver: any
    globalAny.fetch = jest.fn(() => new Promise((resolve) => { resolver = resolve }))
    const p = apiFetch('/dashboard/api/timeout', {}, 10)
    // fast-forward timers to trigger abort
    jest.advanceTimersByTime(50)
    // now resolve the underlying fetch to ensure no unhandled promise
    resolver({ ok: true, text: async () => '{}' })
    await expect(p).rejects.toBeInstanceOf(ApiError)
  })
})
