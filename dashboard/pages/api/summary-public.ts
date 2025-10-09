import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseClient } from '../../../src/lib/db/index'

// simple in-memory cache
let cached: { ts: number; body: any } | null = null
const TTL_MS = 5_000 // 5s

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // return cached if fresh
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return res.status(200).json(cached.body)
  }

  try {
    const sb = getSupabaseClient()
    // call RPC function that returns optimized, skipped, total_original_bytes, total_optimized_bytes
    const { data, error } = await sb.rpc('get_dashboard_summary')
    if (error || !data) {
      cached = { ts: Date.now(), body: { optimized: 0, skipped: 0, bytes_saved: 0 } }
      return res.status(200).json(cached.body)
    }

    // Supabase may return an array with the row
    const row = Array.isArray(data) ? data[0] : data
    const optimized = Number(row?.optimized || 0)
    const skipped = Number(row?.skipped || 0)
    const totalOriginal = Number(row?.total_original_bytes || 0)
    const totalOptimized = Number(row?.total_optimized_bytes || 0)
    const bytes_saved = Math.max(0, totalOriginal - totalOptimized)

    const body = { optimized, skipped, bytes_saved }
    cached = { ts: Date.now(), body }
    return res.status(200).json(body)
  } catch (err) {
    const body = { optimized: 0, skipped: 0, bytes_saved: 0 }
    cached = { ts: Date.now(), body }
    return res.status(200).json(body)
  }
}
