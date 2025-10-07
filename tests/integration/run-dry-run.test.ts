import { discoverAndDryRun } from '../../src/lib/inventory/discover'
import fs from 'fs'
import path from 'path'

describe('full dry-run (integration)', () => {
  test('runs discoverAndDryRun and writes artifacts', async () => {
    const outDir = path.resolve(__dirname, '../../artifacts')
    try { fs.mkdirSync(outDir, { recursive: true }) } catch (e) {}

    const summary = await discoverAndDryRun({ perPage: 50, limitPosts: 50, computeSha: false })
    const outJson = path.join(outDir, 'dry-run.json')
    fs.writeFileSync(outJson, JSON.stringify(summary, null, 2), 'utf8')

    // create a simple CSV of per_image
    const csvRows = ['url,original,estimated']
    for (const p of summary.per_image) {
      const safe = (v: any) => {
        if (v === undefined || v === null) return ''
        const s = String(v)
        if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"'
        return s
      }
      csvRows.push([safe(p.url), safe(p.original), safe(p.estimated)].join(','))
    }
    fs.writeFileSync(path.join(outDir, 'dry-run.csv'), csvRows.join('\n'), 'utf8')

    // ensure summary has expected shape
    expect(typeof summary.total_images).toBe('number')
    expect(Array.isArray(summary.per_image)).toBe(true)
  }, 120000)
})
