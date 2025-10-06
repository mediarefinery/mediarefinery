jest.mock('../../../src/config', () => ({
  config: {
    wpBaseUrl: 'https://example.com',
    webpQualityPhoto: 75,
    webpQualityGraphic: 85,
  },
  loadConfig: () => ({
    wpBaseUrl: 'https://example.com',
    webpQualityPhoto: 75,
    webpQualityGraphic: 85,
  }),
}));

// Mock posts module to return two posts
jest.mock('../../../src/lib/wordpress/posts', () => ({
  fetchPublishedPosts: async function*() {
    yield { id: 1, content: { rendered: '<img src="https://cdn.example.com/a.jpg">' }, featured_media: null };
    yield { id: 2, content: { rendered: '<img src="https://cdn.example.com/b.png">' }, featured_media: null };
  }
}));

// Mock media resolver to return metadata with filesize for one URL
jest.mock('../../../src/lib/wordpress/resolve', () => ({
  resolveMediaForUrls: async (urls: string[]) => {
    const map = new Map();
    for (const u of urls) {
      if (u.endsWith('a.jpg')) map.set(u, { id: 11, source_url: u, mime_type: 'image/jpeg', filesize: 10000, media_details: { files: [{ filesize: 10000 }] } });
      else map.set(u, null);
    }
    return map;
  }
}));

// Mock DB upsert to capture calls
const upsertMock = jest.fn().mockResolvedValue([{ id: 1 }]);
jest.mock('../../../src/lib/db/repository', () => ({
  upsertInventory: upsertMock,
  upsertConfig: jest.fn().mockResolvedValue([{ key: 'dry_run:latest' }]),
}));

const discover = require('../../../src/lib/inventory/discover');

describe('discover dry-run pipeline', () => {
  beforeEach(() => jest.resetAllMocks());

  test('discoverAndDryRun processes posts and returns summary', async () => {
    const summary = await discover.discoverAndDryRun({ perPage: 10 });
    expect(summary.total_images).toBeGreaterThanOrEqual(2);
    expect(summary.per_image.length).toBeGreaterThanOrEqual(2);
    // upsertInventory should have been called for each unique URL
    expect(upsertMock).toHaveBeenCalled();
  });
});
