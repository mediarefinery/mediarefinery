import { logger, setRedactKeys } from '../../../src/lib/logging/logger'

describe('logger', () => {
  beforeEach(() => {
    // default redact keys
    setRedactKeys(['authorization', 'password', 'token', 'apikey', 'apiKey', 'secret', 'credentials'])
    logger.setLevel('debug')
  })

  test('logs JSON line with message and timestamp', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('hello world', { foo: 'bar' })
    expect(spy).toHaveBeenCalled()
    const arg = spy.mock.calls[0][0]
    expect(typeof arg).toBe('string')
    const parsed = JSON.parse(arg)
    expect(parsed.message).toBe('hello world')
    expect(parsed.level).toBe('info')
    expect(parsed.ts).toBeDefined()
    expect(parsed.context).toEqual({ foo: 'bar' })
    spy.mockRestore()
  })

  test('redacts nested secret keys', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const ctx = { user: { name: 'alice', password: 'hunter2' }, headers: { Authorization: 'Bearer abc' } }
    logger.warn('sensitive', ctx)
    const parsed = JSON.parse(spy.mock.calls[0][0])
    expect(parsed.context.user.password).toBe('<REDACTED>')
    expect(parsed.context.headers.Authorization).toBe('<REDACTED>')
    spy.mockRestore()
  })

  test('handles circular references without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const a: any = { name: 'a' }
    const b: any = { name: 'b', peer: a }
    a.peer = b
    logger.debug('circular', { a })
    const parsed = JSON.parse(spy.mock.calls[0][0])
    expect(parsed.context.a.peer).toBeDefined()
    spy.mockRestore()
  })
})
