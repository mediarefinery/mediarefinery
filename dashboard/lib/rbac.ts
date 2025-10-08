export function isAdmin(user: any | null): boolean {
  if (!user) return false
  // Supabase exposes custom claims in user.app_metadata?.roles or user.user_metadata
  try {
    const roles = user?.app_metadata?.roles || user?.user_metadata?.roles
    if (Array.isArray(roles)) return roles.includes('admin')
    if (typeof roles === 'string') return roles === 'admin'
    // Fallback: check a top-level role
    if (user?.role) return user.role === 'admin'
  } catch (_) {
    return false
  }
  return false
}
