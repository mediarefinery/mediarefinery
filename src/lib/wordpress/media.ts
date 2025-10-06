import * as cheerio from 'cheerio';
import { createWpClient } from './client';
import type { WpPost } from './posts';

export function extractImageUrlsFromPost(post: WpPost) {
  const html = post.content?.rendered ?? '';
  const $ = cheerio.load(html);
  const urls: string[] = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) urls.push(src);
    // also capture srcset entries
    const srcset = $(el).attr('srcset');
    if (srcset) {
      const parts = srcset.split(',').map((s) => s.trim().split(' ')[0]);
      for (const p of parts) if (p) urls.push(p);
    }
  });

  return Array.from(new Set(urls));
}

export async function fetchFeaturedMedia(mediaId?: number) {
  if (!mediaId) return null;
  const client = createWpClient();
  const path = `/wp/v2/media/${mediaId}`;
  const res = await client.get(path);
  if (res.status >= 400) return null;
  return res.data as any;
}
