import { aggregateFinalSummary } from '../../../src/lib/reporting/final-summary'

describe('final summary aggregator', () => {
  test('aggregates optimized/skipped/failed and computes savings', () => {
    const items = [
      { id: 1, originalBytes: 1000, optimizedBytes: 600, status: 'OPTIMIZED' },
      { id: 2, originalBytes: 2000, optimizedBytes: 1500, status: 'OPTIMIZED' },
      { id: 3, originalBytes: 500, optimizedBytes: null, status: 'SKIPPED', reason: 'small' },
      { id: 4, originalBytes: 700, optimizedBytes: 0, status: 'FAILED', reason: 'network' },
    ] as any

    const summary = aggregateFinalSummary(items)
    expect(summary.totalItems).toBe(4)
    expect(summary.optimizedCount).toBe(2)
    expect(summary.skippedCount).toBe(1)
    expect(summary.failedCount).toBe(1)
    expect(summary.totalOriginalBytes).toBe(4200)
    // optimized bytes uses 0 for null/undefined
    expect(summary.totalOptimizedBytes).toBe(2100)
    expect(summary.totalBytesSaved).toBe(2100)
    expect(summary.topSkipReasons[0].reason).toBe('small')
  })

  test('includes verification summary when provided', () => {
    const items: any[] = []
    const verification = [{ itemUrl: 'a', ok: true }, { itemUrl: 'b', ok: false }]
    const summary = aggregateFinalSummary(items, verification as any)
    expect(summary.verification).toBeDefined()
    expect(summary.verification?.checked).toBe(2)
    expect(summary.verification?.ok).toBe(1)
  })
})
