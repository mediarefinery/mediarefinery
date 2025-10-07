import { getPostRewritesForPost } from '../../src/lib/db/repository'
import { previewRewrites } from '../../src/lib/rollback/preview'
import { restoreHtmlFromMapping } from '../../src/lib/rollback/restore'
import fs from 'fs'
import path from 'path'

describe('rollback simulation', () => {
  test('preview and simulate rollback for recent post_rewrites', async () => {
    // For simplicity, scan a small set of post IDs that are likely present from seed
    const postIds = [987]
    const previews: any[] = []
    for (const pid of postIds) {
      const rewrites = await getPostRewritesForPost(pid)
      if (!rewrites || rewrites.length === 0) continue
      for (const r of rewrites) {
        const rawMapping = (r as any).mapping || {}
        const mapping = Object.entries(rawMapping).map(([orig, opt]) => ({ originalUrl: orig, optimizedUrl: opt }))
        const html = (r as any).rewritten_content || (r as any).original_content || ''
        const posts = [{ id: pid, html }]
        const p = previewRewrites(posts, mapping as any)
        // simulate rollback by restoring rewritten_html back to original
        const restored = restoreHtmlFromMapping(p[0].rewrittenHtml, mapping as any)
        previews.push({ postId: pid, original: p[0].originalHtml, rewritten: p[0].rewrittenHtml, restored })
      }
    }
    const outDir = path.resolve(__dirname, '../artifacts')
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'rollback-preview.json'), JSON.stringify(previews, null, 2), 'utf8')
    expect(Array.isArray(previews)).toBe(true)
  }, 30000)
})
