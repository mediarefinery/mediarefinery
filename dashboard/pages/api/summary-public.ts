import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseClient } from '../../../src/lib/db/index'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sb = getSupabaseClient()

    // Count optimized
    const optCountResp = await sb.from('media_inventory').select('id', { head: true, count: 'exact' }).eq('status', 'optimized')
    const optimized = Number(optCountResp.count || 0)

    // Count skipped
    const skippedResp = await sb.from('media_inventory').select('id', { head: true, count: 'exact' }).eq('status', 'skipped')
    const skipped = Number(skippedResp.count || 0)

    // Sum original bytes for optimized items
    const origRows = await sb.from('media_inventory').select('file_size_bytes').eq('status', 'optimized')
    let totalOriginal = 0
    if (origRows && Array.isArray(origRows.data || origRows)) {
      const rows = (origRows.data || origRows) as any[]
      totalOriginal = rows.reduce((s, r) => s + Number(r.file_size_bytes || 0), 0)
    }

    // Get optimized inventory ids
    const idsResp = await sb.from('media_inventory').select('id').eq('status', 'optimized')
    const ids = (idsResp.data || idsResp) as any[]
    const inventoryIds = Array.isArray(ids) ? ids.map((r: any) => r.id).filter(Boolean) : []

    let totalOptimized = 0
    if (inventoryIds.length > 0) {
      const optRows = await sb.from('media_optimization').select('inventory_id, file_size_bytes').in('inventory_id', inventoryIds)
      const optData = (optRows.data || optRows) as any[]
      // compute min file_size_bytes per inventory_id
      const mins = new Map<number, number>()
      for (const r of optData || []) {
        const inv = Number(r.inventory_id)
        const size = Number(r.file_size_bytes || 0)
        if (!mins.has(inv) || size < (mins.get(inv) || Infinity)) mins.set(inv, size)
      }
      for (const v of mins.values()) totalOptimized += v
    }

    const bytes_saved = Math.max(0, totalOriginal - totalOptimized)
    return res.status(200).json({ optimized, skipped, bytes_saved })
  } catch (err) {
    return res.status(200).json({ optimized: 0, skipped: 0, bytes_saved: 0 })
  }
}
