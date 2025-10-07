import { pickSample, verifySamples } from '../../../src/lib/verification/sampler'

describe('sampler', () => {
  test('pickSample respects percent and cap', () => {
    const items = Array.from({ length: 100 }).map((_, i) => ({ url: `https://example.com/${i}`, id: i }))
    const s = pickSample(items, 10, 5)
    // percent 10% of 100 = 10 but cap 5 => 5
    expect(s.length).toBeLessThanOrEqual(5)
  })

  test('verifySamples returns results for sample (mock fetch)', async () => {
    // mock global.fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const realFetch = (global as any).fetch
    ;(global as any).fetch = jest.fn().mockImplementation(async (url: string) => ({ status: 200 }))

    const items = [{ url: 'https://ok/1' }, { url: 'https://ok/2' }, { url: 'https://ok/3' }]
    const res = await verifySamples(items, { percent: 50, cap: 10, concurrency: 2, timeoutMs: 1000, retries: 0, retryDelayMs: 10 })
    expect(res.length).toBeGreaterThanOrEqual(1)
    for (const r of res) expect(r.ok).toBe(true)

    ;(global as any).fetch = realFetch
  })
})
