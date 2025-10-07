import { summarizeVerification } from '../../../src/server/routes/verification'

describe('verification summary', () => {
  test('summarizes pass/fail and status codes', () => {
    const recs = [
      { itemUrl: 'a', ok: true, statusCode: 200 },
      { itemUrl: 'b', ok: false, statusCode: 404 },
      { itemUrl: 'c', ok: false },
    ] as any
    const s = summarizeVerification(recs)
    expect(s.total).toBe(3)
    expect(s.ok).toBe(1)
    expect(s.failed).toBe(2)
    expect(s.byStatus['200']).toBe(1)
    expect(s.byStatus['404']).toBe(1)
  })
})
