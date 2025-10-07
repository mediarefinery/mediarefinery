import { listPending, getOptimizationsByInventoryId } from '../../src/lib/db/repository'
import fetch from 'node-fetch'
import { optimizeInventoryItem } from '../../src/lib/image/optimizer'
import fs from 'fs'
import path from 'path'

describe('limited optimize integration', () => {
  test('optimize up to 2 pending items end-to-end', async () => {
    const pending = await listPending(2)
    const results: any[] = []
    for (const p of pending) {
      const res = await fetch(p.attachment_url)
      const buf = Buffer.from(await res.arrayBuffer())
  const ok = await optimizeInventoryItem(p.id, p.attachment_url, buf, p.filename ?? undefined, p.mime_type ?? undefined)
      const opts = await getOptimizationsByInventoryId(p.id)
      results.push({ id: p.id, ok, optimizations: opts })
    }
    const outDir = path.resolve(__dirname, '../artifacts')
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'limited-optimize.json'), JSON.stringify(results, null, 2))
    expect(Array.isArray(results)).toBe(true)
  }, 120000)
})
