import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

function jsonToCsv(obj: any) {
  // expected shape: { summary: {...}, items: [ { id, filename, attachment_url, file_size_bytes, projected_bytes, savings_pct, author, discovered_at }, ... ] }
  const items = obj.items || [];
  if (!Array.isArray(items)) return '';
  const headers = ['id','filename','attachment_url','file_size_bytes','projected_bytes','savings_pct','author','discovered_at'];
  const rows = [headers.join(',')];
  for (const it of items) {
    const row = headers.map((h) => {
      const v = it[h] ?? '';
      if (typeof v === 'string') return `"${String(v).replace(/"/g, '""')}"`;
      return String(v);
    }).join(',');
    rows.push(row);
  }
  return rows.join('\n');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const repoRoot = process.cwd();
    const p = path.join(repoRoot, 'artifacts', 'dry-run.json');
    if (!fs.existsSync(p)) return res.status(404).json({ error: 'dry-run artifact not found' });
    const raw = fs.readFileSync(p, 'utf8');
    const obj = JSON.parse(raw || '{}');
    const format = (req.query.format as string) || 'json';
    if (format === 'csv') {
      const csv = jsonToCsv(obj);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="dry-run.csv"');
      return res.status(200).send(csv);
    }
    return res.status(200).json(obj);
  } catch (err: any) {
    console.error('dry-run api error', err?.message || err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}
