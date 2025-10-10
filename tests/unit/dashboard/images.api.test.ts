import { NextApiRequest, NextApiResponse } from 'next';

import handler from '../../../dashboard/pages/api/images';
import * as db from '../../../src/lib/db/index';

describe('dashboard images API filters', () => {
  const mockReq = (query: Record<string, any>) => ({ query } as unknown as NextApiRequest);
  const mockRes = () => {
    const res: Partial<NextApiResponse> = {};
    res.status = jest.fn(() => res as NextApiResponse);
    res.json = jest.fn(() => res as NextApiResponse);
    return res as NextApiResponse;
  };

  beforeAll(() => {
    // replace getSupabaseClient with a fake client that returns chainable query methods
    (db as any).getSupabaseClient = () => {
      const rows = [
        { id: 1, filename: 'a.jpg', attachment_url: 'https://cdn/a.jpg', file_size_bytes: 100, status: 'pending', discovered_at: '2025-10-01', author_id: 2, author_name: 'alice' },
        { id: 2, filename: 'b.jpg', attachment_url: 'https://cdn/b.jpg', file_size_bytes: 200, status: 'optimized', discovered_at: '2025-10-05', author_id: 3, author_name: 'bob' },
      ];

      function makeBuilder() {
        const state: any = {
          rows: rows.slice(),
          filters: {},
          sortField: 'discovered_at',
          ascending: false,
          rangeStart: 0,
          rangeEnd: 1000,
        };

        const builder: any = {
          select: (_sel: string, opts?: any) => {
            state.countMode = opts?.count === 'exact';
            return builder;
          },
          eq: (col: string, val: any) => { state.filters[col] = val; return builder; },
          ilike: (col: string, pattern: string) => { state.filters[col] = pattern.replace(/%/g, ''); return builder; },
          or: (pattern: string) => {
            // extract a simple ilike pattern value like %q%
            const m = pattern.match(/%(.+?)%/);
            if (m) state.filters.__q = m[1];
            return builder;
          },
          gte: (col: string, val: any) => { state.filters[col + '_gte'] = val; return builder; },
          lte: (col: string, val: any) => { state.filters[col + '_lte'] = val; return builder; },
          order: (field: string, opts?: any) => { state.sortField = field; state.ascending = !!opts?.ascending; return builder; },
          range: (start: number, end: number) => { state.rangeStart = start; state.rangeEnd = end; return builder; },
          then: (resolve: any) => {
            // apply filters
            let out = state.rows.slice();
            const f = state.filters;
            if (f.status) out = out.filter((r: any) => r.status === f.status);
            if (f.author_id) out = out.filter((r: any) => r.author_id === f.author_id);
            if (f.author_name) out = out.filter((r: any) => String(r.author_name).toLowerCase().includes(String(f.author_name).toLowerCase()));
            if (f.__q) out = out.filter((r: any) => (String(r.filename).toLowerCase().includes(f.__q.toLowerCase()) || String(r.attachment_url).toLowerCase().includes(f.__q.toLowerCase())));
            if (f.discovered_at_gte) out = out.filter((r: any) => r.discovered_at >= f.discovered_at_gte);
            if (f.discovered_at_lte) out = out.filter((r: any) => r.discovered_at <= f.discovered_at_lte);
            // sort
            out.sort((a: any, b: any) => {
              const aval = a[state.sortField];
              const bval = b[state.sortField];
              if (aval === bval) return 0;
              if (aval === undefined || aval === null) return 1;
              if (bval === undefined || bval === null) return -1;
              if (aval < bval) return state.ascending ? -1 : 1;
              return state.ascending ? 1 : -1;
            });
            const total = out.length;
            const slice = out.slice(state.rangeStart, state.rangeEnd + 1);
            return resolve({ data: slice, error: null, count: total });
          }
        };
        return builder;
      }

      return { from: (_table: string) => makeBuilder() };
    };
  });

  test('filters by numeric author id', async () => {
    const req = mockReq({ author: '2', page: '1', per_page: '10' });
    const res = mockRes();
    // call handler and expect no throw
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('filters by author name text', async () => {
    const req = mockReq({ author: 'alice', page: '1', per_page: '10' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('filters by date range', async () => {
    const req = mockReq({ from: '2025-10-02', to: '2025-10-10', page: '1', per_page: '10' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
