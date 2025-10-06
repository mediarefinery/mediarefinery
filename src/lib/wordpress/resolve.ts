import { createWpClient } from './client';
import type { WpPost } from './posts';

export type WpMedia = {
  id: number;
  source_url: string;
  media_type: string;
  mime_type?: string;
  media_details?: any;
  [k: string]: any;
};

function basenameFromUrl(u: string) {
  try {
    const p = new URL(u).pathname;
    return p.split('/').filter(Boolean).pop() || '';
  } catch (_) {
    return u.split('/').filter(Boolean).pop() || u;
  }
}

// Try to resolve a single image URL to a WP media object using several heuristics:
// 1) search by basename using the media endpoint's `search` param
// 2) if results returned, prefer exact source_url match, otherwise suffix match
// 3) fallback: request pages of media and scan (limited)
export async function resolveMediaByUrl(url: string, opts?: { perPage?: number; maxPages?: number }): Promise<WpMedia | null> {
  const client = createWpClient();
  const perPage = opts?.perPage ?? 50;
  const maxPages = opts?.maxPages ?? 5;
  const name = basenameFromUrl(url);

  // 1) try search by basename
  try {
    const res = await client.get('/wp/v2/media', { per_page: String(perPage), search: name });
    if (Array.isArray(res.data) && res.data.length > 0) {
      const results = res.data as WpMedia[];
      // prefer exact match
      const exact = results.find((r) => r.source_url === url);
      if (exact) return exact;
      // suffix match (handles CDN variants)
      const suffix = results.find((r) => r.source_url?.endsWith(name));
      if (suffix) return suffix;
    }
  } catch (err) {
    // ignore and continue to fallback
  }

  // 2) fallback: page through media (limited pages)
  try {
    for (let page = 1; page <= maxPages; page++) {
      const res = await client.get('/wp/v2/media', { per_page: String(perPage), page: String(page) });
      if (!Array.isArray(res.data) || res.data.length === 0) break;
      const results = res.data as WpMedia[];
      const exact = results.find((r) => r.source_url === url || r.source_url?.endsWith(name));
      if (exact) return exact;
      if (results.length < perPage) break;
    }
  } catch (err) {
    // ignore
  }

  return null;
}

// Resolve many URLs with a small concurrency and caching
export async function resolveMediaForUrls(urls: string[], opts?: { concurrency?: number }) {
  const map = new Map<string, WpMedia | null>();
  const concurrency = opts?.concurrency ?? 4;
  const work = Array.from(new Set(urls));

  let idx = 0;
  async function worker() {
    while (idx < work.length) {
      const i = idx++;
      const url = work[i];
      try {
        const found = await resolveMediaByUrl(url);
        map.set(url, found);
      } catch (err) {
        map.set(url, null);
      }
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, work.length) }, () => worker());
  await Promise.all(runners);

  return map; // Map<url, WpMedia|null>
}
