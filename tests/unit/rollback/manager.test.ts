import { previewAndPlan, applyRewrites } from '../../../src/lib/rollback/manager';
import * as repo from '../../../src/lib/db/repository';

// Mock fetch globally for post update
const globalAny: any = global;

describe('rollback manager', () => {
  const original = 'https://cdn.example.com/uploads/pic.jpg';
  const optimized = 'https://cdn.example.com/uploads/pic__opt.webp';
  const post = { id: 11, content: `<p><img src="${original}" /></p>`, featured_media: null };
  const mapping = [{ originalUrl: original, optimizedUrl: optimized }];

  beforeAll(() => {
    // mock insertPostRewrite
    jest.spyOn(repo, 'insertPostRewrite').mockImplementation(async (row: any) => [ { id: 1, ...row } ] as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    delete globalAny.fetch;
  });

  test('previewAndPlan returns rewritten html', async () => {
    const previews = await previewAndPlan([post], mapping);
    expect(previews.length).toBe(1);
    expect(previews[0].replacements.length).toBeGreaterThan(0);
  });

  test('applyRewrites posts updated content and records audit', async () => {
    // mock fetch for WP post update
    globalAny.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: post.id }) });

    const res = await applyRewrites([post], mapping, { updateFeatured: false });
    expect(res.length).toBe(1);
    expect(res[0].applied).toBeGreaterThan(0);
    // ensure DB audit inserted
    expect(repo.insertPostRewrite).toHaveBeenCalled();
  });
});
