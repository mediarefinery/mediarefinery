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

export async function uploadMediaBuffer(buf: Buffer, filename: string, mimeType: string) {
  const cfg = (await import('../../config')).loadConfig();
  const base = cfg.wpBaseUrl.replace(/\/$/, '');
  const url = new URL('/wp/v2/media', base).toString();

  const headers: Record<string, string> = {};
  if (cfg.wpAppUser && cfg.wpAppPassword) {
    const token = Buffer.from(`${cfg.wpAppUser}:${cfg.wpAppPassword}`).toString('base64');
    headers.Authorization = `Basic ${token}`;
  }

  // Use WHATWG FormData (available in Node 18+)
  // convert Buffer to ArrayBuffer for Blob constructor
  // Convert Node Buffer to ArrayBuffer view for Blob
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  // @ts-ignore - global FormData type
  const form = new FormData();
  // @ts-ignore Blob global
  form.append('file', new Blob([arrayBuffer]), filename);

  const resp = await fetch(url, { method: 'POST', headers: { ...headers }, body: form as any });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Upload failed: ${resp.status} ${body}`);
  }
  return resp.json();
}
