import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '../../lib/requireAdmin'
import { upsertConfig } from '../../../src/lib/db/repository'
import { z } from 'zod'

const CONFIG_KEY = 'dashboard:settings'

const SettingsSchema = z.object({
  enableAvif: z.boolean().optional(),
  qualityProfile: z.enum(['photographic', 'graphics']).optional(),
  concurrency: z.number().int().min(1).max(64).optional(),
  scheduleStart: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
  scheduleEnd: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guard = await requireAdmin(req as unknown as Request)
  if (!guard.ok) return res.status(guard.status || 401).json({ error: guard.message })

  try {
    if (req.method === 'GET') {
      // read via repository helper
      try {
        const gc = await (await import('../../../src/lib/db/repository')).getConfig(CONFIG_KEY)
        return res.status(200).json({ config: gc || {} })
      } catch (e) {
        return res.status(200).json({ config: {} })
      }
    }

    if (req.method === 'POST') {
      const payload = req.body || {}
      const parsed = SettingsSchema.safeParse(payload)
      if (!parsed.success) {
        return res.status(400).json({ error: 'validation', issues: parsed.error.format() })
      }
      await upsertConfig(CONFIG_KEY, parsed.data)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET,POST')
    return res.status(405).end('Method Not Allowed')
  } catch (err: any) {
    console.error('settings api error', err?.message || err)
    res.status(500).json({ error: String(err?.message || err) })
  }
}
