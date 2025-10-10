import { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../lib/requireAdmin'
import { getAuditLogs } from '../../../src/lib/db/repository'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guard = await requireAdmin(req as unknown as Request)
  if (!guard?.ok) return res.status(403).json({ error: 'unauthorized' })

  const { limit = '50', cursor, action, since } = req.query as Record<string, string>
  const l = parseInt(limit, 10) || 50
  const c = cursor ? parseInt(cursor, 10) : undefined
  try {
    const items = await getAuditLogs({ limit: l, cursor: c, action, since })
    return res.status(200).json({ items })
  } catch (err: any) {
    console.error('audit-logs error', err)
    return res.status(500).json({ error: err?.message ?? 'internal' })
  }
}
