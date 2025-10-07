import { pickSample, verifySamples } from '../../src/lib/verification/sampler'
import { aggregateFinalSummary } from '../../src/lib/reporting/final-summary'
import { summarizeVerification } from '../../src/server/routes/verification'

describe('integration: sampler -> verify -> summary pipeline', () => {
  test('runs sampling and aggregates verification into final summary', async () => {
    // Prepare inventory of 20 items (pretend all were optimized)
    const inventory = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 1,
      url: `https://example.test/image/${i + 1}`,
      originalBytes: 1000 + i * 10,
      optimizedBytes: 600 + i * 5,
      status: 'OPTIMIZED' as const
    }))

  // We'll sample 25% capped low so sample size > 0 via verifySamples

  // Mock global.fetch to return 200 for first half of sample, 500 for the rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const realFetch = (global as any).fetch
    let call = 0
    ;(global as any).fetch = jest.fn().mockImplementation(async () => {
      call++
      return { status: (call % 2 === 0 ? 500 : 200) }
    })

  const itemsToVerify = inventory.map(i => ({ url: i.url }))
  const verifyResults = await verifySamples(itemsToVerify, { percent: 25, cap: 10, concurrency: 3, timeoutMs: 2000, retries: 0, retryDelayMs: 10 })
  const sampleItemsCount = Math.max(1, Math.floor(inventory.length * 0.25))
  expect(verifyResults.length).toBeGreaterThanOrEqual(1)

    const verificationRecords = verifyResults.map(r => ({ itemUrl: r.item.url, ok: r.ok }))

    const summary = aggregateFinalSummary(inventory, verificationRecords as any)
    expect(summary.totalItems).toBe(20)
    expect(summary.verification?.checked).toBe(verificationRecords.length)

    const verSummary = summarizeVerification(verifyResults.map(r => ({ itemUrl: r.item.url, ok: r.ok, statusCode: r.status })) as any)
    expect(verSummary.total).toBe(verifyResults.length)

    ;(global as any).fetch = realFetch
  })
})
