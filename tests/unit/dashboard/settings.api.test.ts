import handler from '../../../dashboard/pages/api/settings'
import * as guard from '../../../dashboard/lib/requireAdmin'
import * as repo from '../../../src/lib/db/repository'

describe('dashboard settings API', () => {
  const mockReq = (method = 'GET', body?: any) => ({ method, body, query: {} } as any)
  const mockRes = () => {
    const res: any = {}
    res.status = jest.fn(() => res)
    res.json = jest.fn(() => res)
    res.end = jest.fn(() => res)
    res.setHeader = jest.fn()
    return res
  }

  beforeAll(() => {
    jest.spyOn(guard as any, 'requireAdmin').mockResolvedValue({ ok: true, user: { id: 'test' } })
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(guard as any, 'requireAdmin').mockResolvedValue({ ok: true, user: { id: 'test' } })
    jest.spyOn(repo as any, 'upsertConfig').mockResolvedValue([{ key: 'dashboard:settings', value: {} }])
  })

  test('POST saves config', async () => {
    const req = mockReq('POST', { enableAvif: true })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ ok: true })
  })

  test('POST invalid payload returns 400 and does not upsert', async () => {
    const spy = jest.spyOn(repo as any, 'upsertConfig')
    const req = mockReq('POST', { enableAvif: 'not-a-bool' })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(spy).not.toHaveBeenCalled()
  })
})
