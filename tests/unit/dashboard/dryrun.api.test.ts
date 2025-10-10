import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

import handler from '../../../dashboard/pages/api/dry-run';

describe('dry-run API', () => {
  const outDir = path.join(process.cwd(), 'artifacts');
  const file = path.join(outDir, 'dry-run.json');

  const sample = {
    summary: { total: 2, total_bytes: 300 },
    items: [
      { id: 1, filename: 'a.jpg', attachment_url: 'https://cdn/a.jpg', file_size_bytes: 100, projected_bytes: 60, savings_pct: 40, author: 'alice', discovered_at: '2025-10-01' },
      { id: 2, filename: 'b.jpg', attachment_url: 'https://cdn/b.jpg', file_size_bytes: 200, projected_bytes: 140, savings_pct: 30, author: 'bob', discovered_at: '2025-10-02' },
    ]
  };

  const mockReq = (query: Record<string, any>) => ({ query } as unknown as NextApiRequest);
  const mockRes = () => {
    const res: Partial<NextApiResponse> = {};
    res.status = jest.fn(() => res as NextApiResponse);
    res.json = jest.fn(() => res as NextApiResponse);
    res.send = jest.fn(() => res as NextApiResponse);
    res.setHeader = jest.fn();
    return res as NextApiResponse;
  };

  beforeAll(() => {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    fs.writeFileSync(file, JSON.stringify(sample, null, 2), 'utf8');
  });

  afterAll(() => {
    try { fs.unlinkSync(file); } catch (e) {}
  });

  test('returns json', async () => {
    const req = mockReq({ format: 'json' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('returns csv', async () => {
    const req = mockReq({ format: 'csv' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });
});
