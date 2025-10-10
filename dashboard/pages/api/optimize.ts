import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../lib/requireAdmin'
import { enqueueJob } from '../../../src/lib/queue'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guard = await requireAdmin(req as unknown as Request)
  if (!guard.ok) return res.status(guard.status || 401).json({ error: guard.message })

  try {
    const { jobId } = await enqueueJob('optimize', { requestedBy: guard.user?.id ?? null })
    return res.status(200).json({ ok: true, queued: true, jobId })
  } catch (err: any) {
    console.error('optimize api error', err?.message || err)
    res.status(500).json({ error: String(err?.message || err) })
  }
}
