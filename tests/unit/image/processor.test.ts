// Tests for image processor ICC preservation logic

// Mock config before importing modules
let mockConfig: any = {
  maxWidth: 2560,
  webpQualityPhoto: 75,
  webpQualityGraphic: 85,
  preserveIcc: 'auto',
  avifEnabled: false,
};

jest.mock('../../../src/config', () => ({
  loadConfig: () => mockConfig,
  config: mockConfig,
}));

// We'll mock sharp to inspect withMetadata calls and simulate metadata
let mockIccSize = 0;
let lastWithMetadataArg: any = null;

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => {
    const obj: any = {
      metadata: jest.fn().mockResolvedValue({ width: 4000, icc: Buffer.alloc(mockIccSize) }),
      resize: jest.fn().mockReturnThis(),
      withMetadata: jest.fn().mockImplementation((m: any) => { lastWithMetadataArg = m; return obj; }),
      webp: jest.fn().mockReturnThis(),
      avif: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('converted')),
    };
    return obj;
  });
});

const processor = require('../../../src/lib/image/processor');

describe('image processor ICC preservation', () => {
  beforeEach(() => {
    mockIccSize = 0;
    lastWithMetadataArg = null;
    mockConfig = { ...mockConfig };
  });

  test('preserve when preserveIcc=always', async () => {
    mockConfig.preserveIcc = 'always';
    mockIccSize = 3000; // > threshold but always should preserve

    const res = await processor.convertToWebP(Buffer.from('imgdata'), 'photo.jpg', 'image/jpeg');
    expect(res.format).toBe('webp');
    expect(lastWithMetadataArg).toBeTruthy();
    // should have passed icc when preserving
    expect(Object.prototype.hasOwnProperty.call(lastWithMetadataArg, 'icc')).toBe(true);
  });

  test('auto preserves when icc <= 2KB and photo', async () => {
    mockConfig.preserveIcc = 'auto';
    mockIccSize = 1024; // <= 2048

    const res = await processor.convertToWebP(Buffer.from('imgdata'), 'photo.jpg', 'image/jpeg');
    expect(res.format).toBe('webp');
    expect(lastWithMetadataArg).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(lastWithMetadataArg, 'icc')).toBe(true);
  });

  test('auto strips when icc > 2KB', async () => {
    mockConfig.preserveIcc = 'auto';
    mockIccSize = 4096; // > 2048

    const res = await processor.convertToWebP(Buffer.from('imgdata'), 'photo.jpg', 'image/jpeg');
    expect(res.format).toBe('webp');
    expect(lastWithMetadataArg).toBeTruthy();
    // should not have icc attached
    expect(Object.prototype.hasOwnProperty.call(lastWithMetadataArg, 'icc')).toBe(false);
  });

  test('never strips even if icc small', async () => {
    mockConfig.preserveIcc = 'never';
    mockIccSize = 100;

    const res = await processor.convertToWebP(Buffer.from('imgdata'), 'photo.jpg', 'image/jpeg');
    expect(res.format).toBe('webp');
    expect(lastWithMetadataArg).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(lastWithMetadataArg, 'icc')).toBe(false);
  });
});
