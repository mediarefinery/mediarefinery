import handler from '../../../dashboard/pages/api/audit-logs'
import * as guard from '../../../dashboard/lib/requireAdmin'
import * as repo from '../../../src/lib/db/repository'

function makeReqRes() {
  const req: any = { method: 'GET', query: {} }
  const res: any = {
    status(code: number) { this._status = code; return this },
    json(payload: any) { this._data = JSON.stringify(payload); return this },
    _getStatusCode() { return this._status ?? 200 },
    _getData() { return this._data ?? '{}' }
  }
  return { req, res }
}

test('audit-logs returns items for admin', async () => {
  jest.spyOn(guard as any, 'requireAdmin').mockResolvedValue({ ok: true, user: { id: 'u1' } })
  jest.spyOn(repo as any, 'getAuditLogs').mockResolvedValue([{ id: 1, action: 'optimize', actor: 'u1', created_at: '2020-01-01T00:00:00Z' }])

  const { req, res } = makeReqRes()
  await handler(req as any, res as any)
  expect(res._getStatusCode()).toBe(200)
  const data = JSON.parse(res._getData())
  expect(data.items).toHaveLength(1)
})
