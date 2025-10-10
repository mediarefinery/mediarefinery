import type { NextApiRequest, NextApiResponse } from 'next'
import { getInventoryById, getOptimizationsByInventoryId } from '../../../../src/lib/db/repository'
import { requireAdmin } from '../../../lib/requireAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // enforce admin guard similar to other protected endpoints
  const guard = await requireAdmin(req as unknown as Request)
  if (!guard.ok) return res.status(guard.status || 401).json({ error: guard.message })

  try {
    const { id } = req.query
    const iid = Number(id)
    if (Number.isNaN(iid)) return res.status(400).json({ error: 'invalid id' })

    const inventory = await getInventoryById(iid)
    if (!inventory) return res.status(404).json({ error: 'not found' })

    const optimizations = await getOptimizationsByInventoryId(iid)

    // Compute savings: choose smallest optimized file_size_bytes if available
    const original = Number(inventory.file_size_bytes || 0)
    const optSizes = optimizations.map((o: any) => Number(o.file_size_bytes || 0)).filter(Boolean)
    const bestOpt = optSizes.length ? Math.min(...optSizes) : null
    const bytes_saved = bestOpt ? Math.max(0, original - bestOpt) : 0
    const reduction_pct = bestOpt && original ? Math.round((bytes_saved / original) * 100) : 0

    // Build thumbnails list from optimizations (use optimized_url)
    const thumbnails = optimizations.map((o: any) => ({ url: o.optimized_url, id: o.id }))

    return res.status(200).json({ inventory, optimizations, bytes_saved, reduction_pct, thumbnails })
  } catch (err: any) {
    console.error('images/[id] error', err?.message || err)
    res.status(500).json({ error: String(err?.message || err) })
  }
}
