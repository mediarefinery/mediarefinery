export function isLikelyGraphic(mimeType?: string, filename?: string) {
  if (!mimeType && !filename) return false;
  const fn = (filename || '').toLowerCase();
  if (mimeType?.includes('svg') || fn.endsWith('.svg')) return true;
  // small raster extensions that are often graphics
  if (fn.endsWith('.png') || fn.endsWith('.gif')) return true;
  return false;
}

export function estimateWebPSize(originalBytes: number, isGraphic: boolean, quality: number) {
  // crude heuristic: photographic compresses more than graphics
  const baseRatio = isGraphic ? 0.8 : 0.6; // photography compresses to ~60%, graphics ~80%
  // quality factor adjusts within +/-10%
  const qAdj = 1 - (quality - 75) / 750; // small effect
  const estimate = Math.max(100, Math.round(originalBytes * baseRatio * qAdj));
  return estimate;
}
