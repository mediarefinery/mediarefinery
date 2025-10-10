import handler from '../../../dashboard/pages/api/bulk-actions'
import * as guard from '../../../dashboard/lib/requireAdmin'

const mockReq = (body = {}) => ({ method: 'POST', body } as any)
const mockRes = () => {
  const r: any = {}
  r.status = jest.fn(() => r)
  r.json = jest.fn(() => r)
  return r
}

describe('bulk-actions API', () => {
  beforeAll(() => {
    jest.spyOn(guard as any, 'requireAdmin').mockResolvedValue({ ok: true, user: { id: 'u1' } })
  })

  test('returns queued for valid payload', async () => {
    const res = mockRes()
    await handler(mockReq({ action: 'optimize', ids: [1,2,3] }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
