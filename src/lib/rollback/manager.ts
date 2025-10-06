import { previewRewrites } from './preview';
import { rewriteHtmlImageUrls, Replacement } from './replace';
import { restoreHtmlFromMapping } from './restore';
import { createWpClient } from '../wordpress/client';
import { insertPostRewrite } from '../db/repository';

type PostRecord = { id: number; content: string; featured_media?: number | null };

export async function previewAndPlan(posts: PostRecord[], mapping: Replacement[]) {
  // returns preview entries per post
  return previewRewrites(posts.map((p) => ({ id: p.id, html: p.content })), mapping);
}

export async function applyRewrites(posts: PostRecord[], mapping: Replacement[], opts?: { updateFeatured?: boolean }) {
  const wp = createWpClient();
  const results: Array<{ postId: number; applied: number; errors?: string[] }> = [];

  for (const p of posts) {
    const { html: rewrittenHtml, replacements } = rewriteHtmlImageUrls(p.content, mapping);
    let applied = 0;
    const errors: string[] = [];

    if (replacements.length > 0) {
      // patch post content
      try {
        // wp client doesn't expose post/put wrapper here — use raw fetch via client.get path but it's okay to call fetch directly
        const cfg = (await import('../../config')).loadConfig();
        const base = cfg.wpBaseUrl.replace(/\/$/, '');
        const url = new URL(`/wp/v2/posts/${p.id}`, base).toString();
        const headers: any = { 'Content-Type': 'application/json' };
        if (cfg.wpAppUser && cfg.wpAppPassword) {
          const token = Buffer.from(`${cfg.wpAppUser}:${cfg.wpAppPassword}`).toString('base64');
          headers.Authorization = `Basic ${token}`;
        }

        const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ content: rewrittenHtml }) });
        if (!resp.ok) {
          const body = await resp.text().catch(() => '');
          errors.push(`post update failed: ${resp.status} ${body}`);
        } else {
          applied += replacements.length;
        }
      } catch (err: any) {
        errors.push(String(err?.message ?? err));
      }

      // store audit records
      try {
        for (const r of replacements) {
          await insertPostRewrite({ post_id: p.id, original_url: r.originalUrl, optimized_url: r.optimizedUrl, field: r.originalSrcAttr ?? 'content', metadata: null });
        }
      } catch (err: any) {
        errors.push(`db insert failed: ${String(err?.message ?? err)}`);
      }
    }

    // optionally update featured_media if mapping includes the featured_media URL
    if (opts?.updateFeatured && p.featured_media) {
      // fetch media object and compare source_url
      try {
        const mediaRes = await wp.get(`/wp/v2/media/${p.featured_media}`);
        if (mediaRes && mediaRes.data && mediaRes.data.source_url) {
          const src = mediaRes.data.source_url as string;
          const found = mapping.find((m) => m.originalUrl === src);
          if (found) {
            // upload/replace: in WP, featured_media is an ID pointing to an attachment; to change we'd need to create a media item or find existing one.
            // For now, if the optimized URL is already present as an attachment in WP, we'd need to find its ID — this implementation logs intent and records an audit.
            // TODO: create or locate attachment for optimizedUrl and set featured_media to its ID.
            // Record an audit entry for featured_media field so operator can review.
            await insertPostRewrite({ post_id: p.id, original_url: src, optimized_url: found.optimizedUrl, field: 'featured_media', metadata: null });
          }
        }
      } catch (err: any) {
        errors.push(`featured_media check failed: ${String(err?.message ?? err)}`);
      }
    }

    results.push({ postId: p.id, applied, errors: errors.length ? errors : undefined });
  }

  return results;
}
