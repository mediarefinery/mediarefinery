import * as api from '../../../dashboard/lib/api';

describe('dashboard api wrapper', () => {
  const globalAny: any = global;

  beforeAll(() => {
    globalAny.fetch = jest.fn((url: string) => {
      if (url.startsWith('/api/summary')) return Promise.resolve({ ok: true, json: async () => ({ optimized: 1 }) });
      if (url.startsWith('/api/images')) return Promise.resolve({ ok: true, json: async () => ({ images: [] }) });
      return Promise.resolve({ ok: false });
    });
  });

  afterAll(() => {
    delete globalAny.fetch;
  });

  test('fetchSummary', async () => {
    const s = await api.fetchSummary();
    expect(s.optimized).toBe(1);
  });

  test('fetchImages', async () => {
    const r = await api.fetchImages(2);
    expect(Array.isArray(r.images)).toBe(true);
  });
});
