import { generateMappingCSV, generateSummaryJSON } from '../../../src/server/routes/export'

describe('export generators', () => {
  test('generateMappingCSV produces CSV with headers and rows', () => {
    const items = [
      { id: 1, url: 'http://a', originalBytes: 100, optimizedBytes: 50, status: 'OPTIMIZED' },
      { id: 2, url: 'http://b', originalBytes: 200, optimizedBytes: null, status: 'SKIPPED', reason: 'small' },
    ] as any
    const csv = generateMappingCSV(items)
    expect(csv.split('\n').length).toBe(3)
    expect(csv.includes('id,url,originalBytes')).toBe(true)
  })

  test('generateSummaryJSON returns aggregated summary', () => {
    const items = [
      { id: 1, originalBytes: 100, optimizedBytes: 50, status: 'OPTIMIZED' }
    ] as any
    const summary = generateSummaryJSON(items)
    expect(summary.totalItems).toBe(1)
    expect(summary.optimizedCount).toBe(1)
  })
})
