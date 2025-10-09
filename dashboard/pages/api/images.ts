import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '../../../src/lib/db/index';

type ImageRow = {
  id: number;
  attachment_url: string;
  filename?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  status?: string | null;
  discovered_at?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const perPage = Math.min(100, Number(req.query.per_page || 20));
  const status = (req.query.status as string) || undefined;
  const sort = (req.query.sort as string) || 'discovered_at';
  const order = (req.query.order as string) || 'desc';
  const qsearch = (req.query.q as string) || undefined;

  // Validate sort field against allowed columns to prevent SQL injection
  const allowedSorts = new Set(['discovered_at', 'file_size_bytes', 'id', 'filename']);
  const sortField = allowedSorts.has(sort) ? sort : 'discovered_at';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const sb = getSupabaseClient();
    let q = sb.from('media_inventory').select('*', { count: 'exact' });
    if (status) q = q.eq('status', status);
    if (qsearch) {
      // simple ILIKE search on filename and attachment_url
      q = q.or(`filename.ilike.%${qsearch}%,attachment_url.ilike.%${qsearch}%`);
    }
    q = q.order(sortField, { ascending: sortOrder === 'asc' }).range((page - 1) * perPage, page * perPage - 1);
    const { data, error, count } = await q;
    if (error) throw error;

    const images = (data || []) as ImageRow[];
    res.status(200).json({ images, page, per_page: perPage, total: count || 0 });
  } catch (err: any) {
    console.error('images api error', err?.message || err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}
