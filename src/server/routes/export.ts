import { aggregateFinalSummary } from '../../lib/reporting/final-summary'
import type { InventoryItem } from '../../lib/reporting/final-summary'

// Generate CSV mapping for inventory items
export function generateMappingCSV(items: InventoryItem[]): string {
  const headers = ['id', 'url', 'originalBytes', 'optimizedBytes', 'status', 'reason']
  const escape = (v: any) => {
    if (v === undefined || v === null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const rows = items.map(i => [i.id, i.url ?? '', i.originalBytes ?? '', i.optimizedBytes ?? '', i.status, i.reason ?? ''].map(escape).join(','))
  return [headers.join(','), ...rows].join('\n')
}

// Generate JSON summary payload
export function generateSummaryJSON(items: InventoryItem[], verification?: any) {
  const summary = aggregateFinalSummary(items, verification)
  return summary
}

// Lightweight route handlers (compatible with Express-like req/res)
export async function exportSummaryHandler(req: any, res: any) {
  try {
    const items: InventoryItem[] = req.body?.items || []
    const verification = req.body?.verification
    const payload = generateSummaryJSON(items, verification)
    return res.json(payload)
  } catch (err) {
    return res.status?.(500)?.json?.({ error: String(err) })
  }
}

export async function exportMappingHandler(req: any, res: any) {
  try {
    const items: InventoryItem[] = req.body?.items || []
    const csv = generateMappingCSV(items)
    res.setHeader?.('Content-Type', 'text/csv')
    return res.send ? res.send(csv) : res.json({ csv })
  } catch (err) {
    return res.status?.(500)?.json?.({ error: String(err) })
  }
}

export default { generateMappingCSV, generateSummaryJSON, exportSummaryHandler, exportMappingHandler }
