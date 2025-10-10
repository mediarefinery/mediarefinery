import optimizeHandler from '../../../dashboard/pages/api/optimize'
import rollbackHandler from '../../../dashboard/pages/api/rollback'
import * as guard from '../../../dashboard/lib/requireAdmin'

const mockReq = () => ({ method: 'POST' } as any)
const mockRes = () => {
  const r: any = {}
  r.status = jest.fn(() => r)
  r.json = jest.fn(() => r)
  return r
}

describe('operations APIs', () => {
  beforeAll(() => {
    jest.spyOn(guard as any, 'requireAdmin').mockResolvedValue({ ok: true, user: { id: 'test' } })
  })

  test('optimize returns queued job', async () => {
    const res = mockRes()
    await optimizeHandler(mockReq(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('rollback returns queued job', async () => {
    const res = mockRes()
    await rollbackHandler(mockReq(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
