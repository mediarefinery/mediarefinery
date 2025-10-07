import { isAdmin } from '../../../src/lib/auth/rbac'

describe('rbac.isAdmin', () => {
  test('returns true for user.role=admin', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true)
  })
  test('returns true for roles array', () => {
    expect(isAdmin({ roles: ['user', 'admin'] })).toBe(true)
  })
  test('returns false for non-admin', () => {
    expect(isAdmin({ role: 'user' })).toBe(false)
  })
})
