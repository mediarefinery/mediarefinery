import { loadConfig } from '../../config';
import { isAdmin } from '../../lib/auth/rbac'

export function requireAuth(req: any, res: any, next: any) {
  const cfg = loadConfig();
  // Simple guard: require presence of a header matching an env token (for dev)
  const token = req.headers['x-api-key'] || req.headers['authorization'];
  if (token && token === cfg.dashboardApiKey) return next();
  res.statusCode = 401;
  res.end('Unauthorized');
}

export function requireAdmin(req: any, res: any, next: any) {
  // assume req.user is set by earlier auth step (e.g., decoded from session/JWT)
  const user = req.user
  if (isAdmin(user)) return next()
  res.statusCode = 403
  res.end('Forbidden')
}

export default { requireAuth, requireAdmin }
