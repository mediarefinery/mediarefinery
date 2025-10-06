import { convertToOptimized, MultiFormatResult } from './processor';
import { generateUniqueFilename } from './filename';
import { uploadMediaBuffer } from '../wordpress/media';
import { insertOptimization, updateInventoryStatus } from '../db/repository';

export async function optimizeInventoryItem(inventoryId: number, originalUrl: string, inputBuffer: Buffer, filename?: string, mimeType?: string) {
  try {
    // 1) convert to optimized formats
    const multi: MultiFormatResult = await convertToOptimized(inputBuffer, filename, mimeType);

    // 2) generate unique filename for webp
    const webpName = await generateUniqueFilename(originalUrl, '.webp');
    if (multi.webp) {
      const uploaded = await uploadMediaBuffer(multi.webp.buffer, webpName, 'image/webp');
      await insertOptimization({ inventory_id: inventoryId, optimized_url: uploaded.source_url || uploaded.url || uploaded.sourceUrl || '', filename: webpName, mime_type: 'image/webp', file_size_bytes: multi.webp.bytes, format: 'webp' });
    }

    if (multi.avif) {
      const avifName = webpName.replace(/\.webp$/, '.avif');
      const uploaded = await uploadMediaBuffer(multi.avif.buffer, avifName, 'image/avif');
      await insertOptimization({ inventory_id: inventoryId, optimized_url: uploaded.source_url || uploaded.url || uploaded.sourceUrl || '', filename: avifName, mime_type: 'image/avif', file_size_bytes: multi.avif.bytes, format: 'avif' });
    }

    // 3) mark inventory as optimized
    await updateInventoryStatus(inventoryId, 'optimized', null);
    return true;
  } catch (err: any) {
    // record error and mark as skipped/failed
    const msg = err?.message ? String(err.message) : String(err);
    try { await updateInventoryStatus(inventoryId, 'error', msg); } catch (_) {}
    return false;
  }
}
