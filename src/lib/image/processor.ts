import sharp from 'sharp';
import { isLikelyGraphic } from './quality-profile';
import { loadConfig } from '../../config';

export type ProcessOptions = {
  targetMaxWidth?: number; // pixels
  quality?: number; // 0-100
};

export type ProcessResult = {
  format: 'webp' | 'avif' | 'original';
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
};

export type MultiFormatResult = {
  webp?: ProcessResult;
  avif?: ProcessResult;
  original?: ProcessResult;
};

// Default policy as described in PRD 4.1: downscale images larger than 2560px
const DEFAULT_MAX_WIDTH = 2560;
const ICC_PRESERVE_THRESHOLD = 2048; // bytes

function getConfig() {
  try {
    return loadConfig();
  } catch (_) {
    // in tests or environments where dotenv isn't loaded, fall back to defaults
    return {
      maxWidth: DEFAULT_MAX_WIDTH,
      webpQualityPhoto: 75,
      webpQualityGraphic: 85,
      preserveIcc: 'auto',
      avifEnabled: false,
    } as const;
  }
}

export async function convertToWebP(inputBuffer: Buffer, filename?: string, mimeType?: string, opts?: ProcessOptions): Promise<ProcessResult> {
  const cfg = getConfig();
  const maxWidth = opts?.targetMaxWidth ?? cfg.maxWidth ?? DEFAULT_MAX_WIDTH;

  const isGraphic = isLikelyGraphic(mimeType, filename);
  const quality = typeof opts?.quality === 'number' ? opts!.quality : (isGraphic ? cfg.webpQualityGraphic : cfg.webpQualityPhoto);

  const image = sharp(inputBuffer, { failOnError: false, limitInputPixels: 10000 * 10000 });
  const meta = await image.metadata();

  let pipeline = image;

  // Downscale if original width exceeds maxWidth
  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  // Decide on ICC preservation based on config
  const preserveIccSetting = cfg.preserveIcc ?? 'auto';
  let preserveIcc = false;

  if (preserveIccSetting === 'always') preserveIcc = true;
  else if (preserveIccSetting === 'never') preserveIcc = false;
  else {
    // auto: preserve only for photographic images when ICC size <= threshold
    if (!isGraphic && meta.icc) {
      const iccSize = Buffer.byteLength(meta.icc as unknown as string, 'binary');
      preserveIcc = iccSize <= ICC_PRESERVE_THRESHOLD;
    }
  }

  // sharp's withMetadata can accept an icc buffer to attach. If we want to preserve, re-attach the original ICC.
  if (preserveIcc && meta.icc) {
    // meta.icc may be Buffer in Node typings; coerce safely
    pipeline = pipeline.withMetadata({ icc: meta.icc as any });
  } else {
    // ensure metadata doesn't include ICC
    pipeline = pipeline.withMetadata({});
  }

  const webpBuffer = await pipeline.webp({ quality }).toBuffer();
  const outMeta = await sharp(webpBuffer).metadata();

  return {
    format: 'webp',
    buffer: webpBuffer,
    width: outMeta.width ?? meta.width ?? 0,
    height: outMeta.height ?? meta.height ?? 0,
    bytes: webpBuffer.length,
  };
}

// New: convert to multiple optimized formats (webp + optional avif)
export async function convertToOptimized(inputBuffer: Buffer, filename?: string, mimeType?: string, opts?: ProcessOptions): Promise<MultiFormatResult> {
  const cfg = getConfig();
  const webp = await convertToWebP(inputBuffer, filename, mimeType, opts);
  const result: MultiFormatResult = { webp };

  if (cfg.avifEnabled) {
    // create a fresh pipeline from inputBuffer to avoid reusing transformed buffer
    const isGraphic = isLikelyGraphic(mimeType, filename);
    const quality = typeof opts?.quality === 'number' ? opts!.quality : (isGraphic ? cfg.webpQualityGraphic : cfg.webpQualityPhoto);
    const image = sharp(inputBuffer, { failOnError: false, limitInputPixels: 10000 * 10000 });
    const meta = await image.metadata();
    let pipeline = image;
    if (meta.width && meta.width > (opts?.targetMaxWidth ?? cfg.maxWidth)) {
      pipeline = pipeline.resize({ width: opts?.targetMaxWidth ?? cfg.maxWidth, withoutEnlargement: true });
    }

    // ICC preservation logic same as webp
    const preserveIccSetting = cfg.preserveIcc ?? 'auto';
    let preserveIcc = false;
    if (preserveIccSetting === 'always') preserveIcc = true;
    else if (preserveIccSetting === 'never') preserveIcc = false;
    else {
      if (!isGraphic && meta.icc) {
        const iccSize = Buffer.byteLength(meta.icc as unknown as string, 'binary');
        preserveIcc = iccSize <= ICC_PRESERVE_THRESHOLD;
      }
    }
    if (preserveIcc && meta.icc) pipeline = pipeline.withMetadata({ icc: meta.icc as any });
    else pipeline = pipeline.withMetadata({});

    const avifBuffer = await pipeline.avif({ quality }).toBuffer();
    const outMeta = await sharp(avifBuffer).metadata();
    result.avif = {
      format: 'avif',
      buffer: avifBuffer,
      width: outMeta.width ?? meta.width ?? 0,
      height: outMeta.height ?? meta.height ?? 0,
      bytes: avifBuffer.length,
    };
  }

  return result;
}

export async function maybeDownscaleAndReturnOriginal(inputBuffer: Buffer, filename?: string, mimeType?: string, opts?: ProcessOptions): Promise<ProcessResult> {
  // If no conversion desired, return original metadata
  const image = sharp(inputBuffer, { failOnError: false });
  const meta = await image.metadata();
  return {
    format: 'original',
    buffer: inputBuffer,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    bytes: inputBuffer.length,
  };
}

