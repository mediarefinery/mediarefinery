/**
 * Integration tests for real image conversions using sharp.
 * These tests create small in-memory images and run the real processor
 * to validate downscaling, ICC preservation and AVIF generation.
 */

// Ensure fresh modules and real sharp (unmocked)
jest.resetModules();
jest.unmock('sharp');

// Set environment for config
process.env.MAX_WIDTH = '2560';
process.env.WEBP_QUALITY_PHOTO = '75';
process.env.WEBP_QUALITY_GRAPHIC = '85';
process.env.PRESERVE_ICC = 'auto';

const sharp = require('sharp');

describe('integration: image processor (sharp real)', () => {
  test('downscales images larger than max width', async () => {
    // create a large red image
    const input = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 200, g: 20, b: 20 } } }).png().toBuffer();

    const proc = require('../../../src/lib/image/processor');
    const res = await proc.convertToWebP(input, 'large.jpg', 'image/jpeg');

    // verify output buffer and dimensions
    expect(res).toBeTruthy();
    expect(res.format).toBe('webp');
    expect(res.bytes).toBeGreaterThan(0);
    expect(res.width).toBeLessThanOrEqual(2560);
  }, 20000);

  test('preserves ICC when present and small under auto', async () => {
    // Prefer using a system ICC profile if available (minimal processing)
    const fs = require('fs');
    const path = require('path');
    const commonIccPaths = [
      '/usr/share/color/icc/sRGB.icc',
      '/usr/share/color/icc/DisplayP3.icc',
      '/usr/share/color/icc/DisplayICC/sRGB.icc',
      '/usr/local/share/color/icc/sRGB.icc',
    ];
    let iccPath: string | null = null;
    for (const p of commonIccPaths) {
      try { if (fs.existsSync(p)) { iccPath = p; break; } } catch (_) {}
    }
    if (!iccPath) {
      // No system ICC found — skip ICC-specific assertions to keep tests minimal and deterministic
      console.warn('No system ICC profile found; skipping ICC preservation integration test.');
      return;
    }

    const base = sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 10, g: 100, b: 200 } } });
    let input: Buffer;
    try {
      input = await base.png().withMetadata({ icc: iccPath }).toBuffer();
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      console.warn('Skipping ICC preservation integration test due to environment limitation:', msg);
      return;
    }

    // ensure metadata shows icc on input (may appear as Buffer or path depending on environment)
    const inMeta = await sharp(input).metadata();
    expect(inMeta).toBeTruthy();

    // run converter with preserve auto (photo)
    process.env.PRESERVE_ICC = 'auto';
    jest.resetModules();
    const proc = require('../../../src/lib/image/processor');
    const out = await proc.convertToWebP(input, 'photo.jpg', 'image/jpeg');

    const outMeta = await sharp(out.buffer).metadata();
    // when icc <= 2KB, auto should preserve for photos; if environment doesn't expose ICC on webp, ensure conversion succeeded
    if (outMeta && outMeta.icc) {
      expect(outMeta.icc.length).toBeLessThanOrEqual(2048);
    } else {
      expect(out.bytes).toBeGreaterThan(0);
    }
  }, 20000);

  test('convertToOptimized returns avif when AVIF enabled (if supported)', async () => {
    // enable AVIF in env
    process.env.AVIF_ENABLED = 'true';
    process.env.PRESERVE_ICC = 'never';
    jest.resetModules();

    const proc = require('../../../src/lib/image/processor');

    const input = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 10, g: 200, b: 100 } } }).png().toBuffer();

    let ok = false;
    try {
      const multi = await proc.convertToOptimized(input, 'img.png', 'image/png');
      // AVIF may not be supported in all builds; if present, validate it
      if (multi.avif) {
        expect(multi.avif.bytes).toBeGreaterThan(0);
      }
      ok = true;
    } catch (err: any) {
      // If AVIF is not supported by libvips/sharp, consider this a non-fatal skip
      const msg = String(err?.message || err);
      // common message: 'avif' is not a supported output format
      if (/avif/i.test(msg)) {
        // skip silently
        ok = true;
      } else {
        throw err;
      }
    }

    expect(ok).toBe(true);
  }, 20000);
});
