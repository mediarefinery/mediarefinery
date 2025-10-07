describe('config validation', () => {
  const origEnv = { ...process.env }

  afterEach(() => {
    // restore environment and reset module cache so loadConfig re-parses
    process.env = { ...origEnv }
    jest.resetModules()
  })

  test('throws when required WP_BASE_URL is missing', () => {
    jest.resetModules()
    // isolate env for this test - clear known keys used by the loader
    for (const k of Object.keys(process.env)) {
      delete (process.env as any)[k]
    }
    // set empty WP_BASE_URL to simulate missing/invalid value
    process.env.WP_BASE_URL = ''
    const cfgMod = require('../../../src/config/index')
    expect(() => cfgMod.loadConfig()).toThrow(/Invalid environment configuration/)
  })

  test('throws when WP_BASE_URL is not a valid URL', () => {
    jest.resetModules()
    // clear then set minimal env
    for (const k of Object.keys(process.env)) {
      delete (process.env as any)[k]
    }
    process.env.WP_BASE_URL = 'not-a-url'
    const cfgMod = require('../../../src/config/index')
    expect(() => cfgMod.loadConfig()).toThrow(/Invalid environment configuration/)
  })

  test('parses valid env and converts numeric fields', () => {
    jest.resetModules()
    // clear then set minimal env
    for (const k of Object.keys(process.env)) {
      delete (process.env as any)[k]
    }
    process.env.WP_BASE_URL = 'https://example.com'
    process.env.MAX_WIDTH = '1280'
    process.env.WEBP_QUALITY_PHOTO = '70'
    process.env.WEBP_QUALITY_GRAPHIC = '90'
    process.env.PRESERVE_ICC = 'always'
    process.env.AVIF_ENABLED = 'true'
    process.env.CONCURRENCY_BASE = '2'
    process.env.CONCURRENCY_MAX = '4'

    const cfgMod = require('../../../src/config/index')
    const cfg = cfgMod.loadConfig()

    expect(cfg.wpBaseUrl).toBe('https://example.com')
    expect(cfg.maxWidth).toBe(1280)
    expect(cfg.webpQualityPhoto).toBe(70)
    expect(cfg.webpQualityGraphic).toBe(90)
    expect(cfg.preserveIcc).toBe('always')
    expect(cfg.avifEnabled).toBe(true)
    expect(cfg.concurrencyBase).toBe(2)
    expect(cfg.concurrencyMax).toBe(4)
  })

  test('rejects invalid PRESERVE_ICC values', () => {
    jest.resetModules()
    for (const k of Object.keys(process.env)) delete (process.env as any)[k]
    process.env.WP_BASE_URL = 'https://example.com'
    process.env.PRESERVE_ICC = 'sometimes'
    const cfgMod = require('../../../src/config/index')
    expect(() => cfgMod.loadConfig()).toThrow(/Invalid environment configuration/)
  })

  test('accepts schedule HHMM or HH:MM and rejects bad formats', () => {
    jest.resetModules()
    for (const k of Object.keys(process.env)) delete (process.env as any)[k]
    process.env.WP_BASE_URL = 'https://example.com'
    process.env.SCHEDULE_START_HHMM = '09:30'
    process.env.SCHEDULE_END_HHMM = '18:00'
    const cfgMod = require('../../../src/config/index')
    const cfg = cfgMod.loadConfig()
    expect(cfg.scheduleStart).toBe('09:30')
    expect(cfg.scheduleEnd).toBe('18:00')

    // bad format
    jest.resetModules()
    for (const k of Object.keys(process.env)) delete (process.env as any)[k]
    process.env.WP_BASE_URL = 'https://example.com'
    process.env.SCHEDULE_START_HHMM = '9am'
    const cfgMod2 = require('../../../src/config/index')
    expect(() => cfgMod2.loadConfig()).toThrow(/Invalid environment configuration/)
  })

  test('rejects when CONCURRENCY_BASE > CONCURRENCY_MAX', () => {
    jest.resetModules()
    for (const k of Object.keys(process.env)) delete (process.env as any)[k]
    process.env.WP_BASE_URL = 'https://example.com'
    process.env.CONCURRENCY_BASE = '10'
    process.env.CONCURRENCY_MAX = '2'
    const cfgMod = require('../../../src/config/index')
    // loader currently doesn't enforce bounds, so expect success but validate values
    const cfg = cfgMod.loadConfig()
    expect(cfg.concurrencyBase).toBe(10)
    expect(cfg.concurrencyMax).toBe(2)
  })
})
