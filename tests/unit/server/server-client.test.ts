describe('server WordPress client', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    process.env.WP_BASE_URL = 'https://wp.test'
    // Provide required secrets so secrets module validation won't throw
    process.env.WP_USERNAME = 'u'
    process.env.WP_PASSWORD = 'p'
    process.env.SUPABASE_URL = 'x'
    process.env.SUPABASE_SERVICE_KEY = 'k'
    process.env.JWT_SECRET = 's'
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('wpGet uses Authorization header with Basic token', async () => {
    // Mock fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const realFetch = (global as any).fetch
    ;(global as any).fetch = jest.fn().mockImplementation(async (url: string, opts: any) => {
      expect(url).toBe('https://wp.test/some/path')
      expect(opts.headers.Authorization).toMatch(/^Basic /)
      return { status: 200 }
    })

    const client = require('../../../src/server/wordpress/server-client')
    const res = await client.wpGet('/some/path')
    expect(res.status).toBe(200)

    ;(global as any).fetch = realFetch
  })
})
