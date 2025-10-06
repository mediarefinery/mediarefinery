import { createWpClient } from './client';

export type WpPost = {
  id: number;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  featured_media?: number;
  link?: string;
  [k: string]: any;
};

export async function* fetchPublishedPosts(opts?: { perPage?: number; maxPages?: number; author?: number | string; after?: string; before?: string }) {
  const perPage = opts?.perPage ?? 100;
  const maxPages = opts?.maxPages ?? Infinity;
  const author = opts?.author;
  const after = opts?.after;
  const before = opts?.before;
  const client = createWpClient();

  let page = 1;
  while (page <= maxPages) {
    const path = `/wp/v2/posts`;
    const params: Record<string, string> = {
      status: 'publish',
      per_page: String(perPage),
      page: String(page),
      _embed: 'false',
    };
    if (author !== undefined) params.author = String(author);
    if (after) params.after = after;
    if (before) params.before = before;

    const res = await client.get(path, params);
    if (res.status === 404) return;
    if (!Array.isArray(res.data)) break;

    const posts = res.data as WpPost[];
    if (posts.length === 0) break;

    for (const p of posts) yield p;

    // stop if we received fewer than perPage items
    if (posts.length < perPage) break;
    page += 1;
  }
}
