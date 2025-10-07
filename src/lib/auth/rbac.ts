// RBAC helpers

export type UserShape = any

export function isAdmin(user: UserShape | undefined | null): boolean {
  if (!user) return false
  // common shapes
  if (user.role === 'admin') return true
  if (Array.isArray(user.roles) && user.roles.includes('admin')) return true
  if (user.app_metadata && Array.isArray(user.app_metadata.roles) && user.app_metadata.roles.includes('admin')) return true
  // Supabase style: user?.user_metadata?.is_admin
  if (user.user_metadata && user.user_metadata.is_admin) return true
  return false
}

export default { isAdmin }
