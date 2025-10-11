import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../lib/requireAdmin'
import { enqueueJob } from '../../../src/lib/queue'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guard = await requireAdmin(req as unknown as Request)
  if (!guard.ok) return res.status(guard.status || 401).json({ error: guard.message })

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { action, ids } = req.body || {}
    if (!action || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'invalid payload' })

    const { jobId } = await enqueueJob('bulk-action', { action, ids, requestedBy: guard.user?.id ?? null })
    return res.status(200).json({ ok: true, queued: true, jobId })
  } catch (err: any) {
    console.error('bulk-actions api error', err?.message || err)
    res.status(500).json({ error: String(err?.message || err) })
  }
}
