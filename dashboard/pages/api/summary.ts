import { requireAdmin } from '../../lib/requireAdmin'

export default async function handler(req: any, res: any) {
  const result = await requireAdmin(req as unknown as Request)
  if (!result.ok) return res.status(result.status || 401).json({ error: result.message })

  // Return a minimal summary placeholder
  return res.status(200).json({ optimized: 0, skipped: 0, bytes_saved: 0 })
}
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const sample = { optimized: 0, skipped: 0, bytesSaved: 0 };
  res.status(200).json(sample);
}
