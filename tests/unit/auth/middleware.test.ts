import { requireAdmin } from '../../../src/server/middleware/auth'

describe('requireAdmin middleware', () => {
  test('allows admin user', () => {
    const req: any = { user: { role: 'admin' } }
    const res: any = {}
    const next = jest.fn()
    requireAdmin(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  test('denies non-admin user', () => {
    const req: any = { user: { role: 'user' } }
    const res: any = { end: jest.fn(), statusCode: 0 }
    const next = jest.fn()
    requireAdmin(req, res, next)
    expect(res.statusCode).toBe(403)
    expect(res.end).toHaveBeenCalledWith('Forbidden')
    expect(next).not.toHaveBeenCalled()
  })
})
