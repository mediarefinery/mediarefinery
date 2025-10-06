// Mock config before importing modules that call loadConfig
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

// Mock the WP client creator used by fetchFeaturedMedia
jest.mock('../../../src/lib/wordpress/client', () => ({
  createWpClient: () => ({
    get: jest.fn().mockResolvedValue({ status: 200, data: { id: 123, source_url: 'https://cdn.example.com/img.jpg' } }),
  }),
}));

const media = require('../../../src/lib/wordpress/media');

describe('wordpress media helpers', () => {
  test('extractImageUrlsFromPost parses src and srcset', () => {
    const post = {
      content: { rendered: '<p><img src="https://a/b.jpg" srcset="https://a/small.jpg 300w, https://a/large.jpg 1200w"></p>' },
    };

    const urls = media.extractImageUrlsFromPost(post);
    expect(urls).toContain('https://a/b.jpg');
    expect(urls).toContain('https://a/small.jpg');
    expect(urls).toContain('https://a/large.jpg');
    // deduplicated
    expect(urls.length).toBe(3);
  });

  test('fetchFeaturedMedia returns media object', async () => {
    const res = await media.fetchFeaturedMedia(123);
    expect(res).toBeTruthy();
    expect(res.id).toBe(123);
    expect(res.source_url).toBe('https://cdn.example.com/img.jpg');
  });
});
