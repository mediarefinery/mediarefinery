import { parseTokenFromRequest, fetchSupabaseUser } from './supabaseAuth'
import { isAdmin } from './rbac'

export async function requireAdmin(req: Request) {
  const token = parseTokenFromRequest(req)
  if (!token) return { ok: false, status: 401, message: 'Unauthorized' }

  const user = await fetchSupabaseUser(token)
  if (!isAdmin(user)) return { ok: false, status: 403, message: 'Forbidden' }

  return { ok: true, user }
}
