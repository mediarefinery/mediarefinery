// Tests for optimizer orchestration

// Mock config
jest.mock('../../../src/config', () => ({
  loadConfig: () => ({ avifEnabled: false, maxWidth: 2560, webpQualityPhoto: 75, webpQualityGraphic: 85, preserveIcc: 'auto' }),
  config: {},
}));

// Mock processor to return both webp and avif when needed
jest.mock('../../../src/lib/image/processor', () => ({
  convertToOptimized: jest.fn().mockImplementation((buf: Buffer) => ({
    webp: { buffer: Buffer.from('webp'), width: 100, height: 100, bytes: 1234, format: 'webp' },
  })),
}));

// Mock filename generator
jest.mock('../../../src/lib/image/filename', () => ({ generateUniqueFilename: jest.fn().mockResolvedValue('img__opt.webp') }));

// Mock upload to simulate failure/success
const uploadMock = jest.fn().mockResolvedValue({ source_url: 'https://cdn.example.com/img__opt.webp' });
jest.mock('../../../src/lib/wordpress/media', () => ({ uploadMediaBuffer: (buf: Buffer, filename: string, mime: string) => uploadMock(buf, filename, mime) }));

// Mock DB repository
const insertOptMock = jest.fn().mockResolvedValue([{}]);
const updateStatusMock = jest.fn().mockResolvedValue([{}]);
jest.mock('../../../src/lib/db/repository', () => ({ insertOptimization: (...a: any[]) => insertOptMock(...a), updateInventoryStatus: (...a: any[]) => updateStatusMock(...a) }));

const optimizer = require('../../../src/lib/image/optimizer');

describe('optimizer orchestration', () => {
  beforeEach(() => {
    uploadMock.mockClear();
    insertOptMock.mockClear();
    updateStatusMock.mockClear();
  });

  test('happy path uploads webp and marks optimized', async () => {
    const ok = await optimizer.optimizeInventoryItem(1, 'https://cdn.example.com/orig.jpg', Buffer.from('orig'));
    expect(ok).toBe(true);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(insertOptMock).toHaveBeenCalled();
    expect(updateStatusMock).toHaveBeenCalledWith(1, 'optimized', null);
  });

  test('upload failure marks error', async () => {
    uploadMock.mockRejectedValueOnce(new Error('upload fail'));
    const ok = await optimizer.optimizeInventoryItem(2, 'https://cdn.example.com/orig2.jpg', Buffer.from('orig'));
    expect(ok).toBe(false);
    expect(updateStatusMock).toHaveBeenCalledWith(2, 'error', expect.stringContaining('upload fail'));
  });
});
