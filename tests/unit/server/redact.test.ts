import { redactMiddleware } from '../../../src/server/middleware/redact'
import { logger } from '../../../src/lib/logging/logger'

describe('redactMiddleware', () => {
  test('redacts nested keys in body, query, and headers', () => {
    const req: any = {
      body: { user: { name: 'alice', password: 'hunter2' }, token: 'abc' },
      query: { apiKey: 'secret-key', page: '1' },
      headers: { authorization: 'Bearer xyz', 'x-other': 'keep' }
    }
    const res: any = {}
    let called = false
    const next = () => { called = true }

    const mw = redactMiddleware()
    mw(req, res, next)

    expect(called).toBe(true)
    expect(req.body.user.password).toBe('<REDACTED>')
    expect(req.body.token).toBe('<REDACTED>')
    expect(req.query.apiKey).toBe('<REDACTED>')
    expect(req.headers.authorization).toBe('<REDACTED>')
    expect(req.headers['x-other']).toBe('keep')
  })
})
