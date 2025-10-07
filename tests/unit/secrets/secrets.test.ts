describe('secrets loader', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('throws when required secrets missing', () => {
    // Ensure required vars are not present
    delete process.env.WP_USERNAME
    delete process.env.WP_PASSWORD
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_KEY
    delete process.env.JWT_SECRET

    expect(() => require('../../../src/lib/secrets')).toThrow()
  })

  test('loads when required secrets present', () => {
    process.env.WP_USERNAME = 'u'
    process.env.WP_PASSWORD = 'p'
    process.env.SUPABASE_URL = 'https://x'
    process.env.SUPABASE_SERVICE_KEY = 'k'
    process.env.JWT_SECRET = 's'

    const mod = require('../../../src/lib/secrets')
    expect(mod.getSecret('WP_USERNAME')).toBe('u')
    expect(mod.getAllSecrets().WP_USERNAME).toBe('u')
    expect(mod.redactSecrets({ WP_USERNAME: 'u', OTHER: 'v' }).WP_USERNAME).toBe('<REDACTED>')
  })
})
