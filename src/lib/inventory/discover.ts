import { fetchPublishedPosts } from '../wordpress/posts';
import { extractImageUrlsFromPost, fetchFeaturedMedia } from '../wordpress/media';
import { resolveMediaForUrls } from '../wordpress/resolve';
import { sha256FromStream } from '../image/hash';
import { isLikelyGraphic, estimateWebPSize } from '../image/quality-profile';
import { upsertInventory, upsertConfig, findInventoryBySha256 } from '../db/repository';
import { loadConfig } from '../../config';

export type DryRunSummary = {
  total_images: number;
  total_bytes: number;
  estimated_webp_bytes: number;
  estimated_savings: number;
  per_image: Array<{ url: string; original: number; estimated: number }>;
};

export async function discoverAndDryRun(opts?: { perPage?: number; limitPosts?: number; computeSha?: boolean; author?: number | string; after?: string; before?: string }) {
  const cfg = loadConfig();
  const perPage = opts?.perPage ?? 50;
  const maxPosts = opts?.limitPosts ?? Infinity;
  const computeSha = !!opts?.computeSha;
  const author = opts?.author;
  const after = opts?.after;
  const before = opts?.before;

  const urls: string[] = [];
  let processedPosts = 0;

  for await (const post of fetchPublishedPosts({ perPage, author, after, before })) {
    const extracted = extractImageUrlsFromPost(post);
    if (post.featured_media) {
      const fm = await fetchFeaturedMedia(post.featured_media as number);
      if (fm?.source_url) extracted.push(fm.source_url);
    }
    urls.push(...extracted);
    processedPosts += 1;
    if (processedPosts >= maxPosts) break;
  }

  const uniqueUrls = Array.from(new Set(urls));
  // resolve media objects (attachment metadata) where possible
  const resolved = await resolveMediaForUrls(uniqueUrls);

  const perImage: DryRunSummary['per_image'] = [];
  let totalBytes = 0;
  let estimatedTotal = 0;

  for (const url of uniqueUrls) {
    // try to get file size from resolved metadata
    const media = resolved.get(url) as any;
    let size = media?.media_details?.files?.[0]?.filesize || media?.filesize || null;
    // if no size, try a HEAD fetch
    if (!size) {
      try {
        const h = await fetch(url, { method: 'HEAD' as any });
        const cl = h.headers.get('content-length');
        if (cl) size = Number(cl);
      } catch (_) {
        size = null;
      }
    }

    // as a last resort, attempt a partial GET and hash the stream to compute sha (and size)
    if (!size) {
      try {
        const r = await fetch(url);
        const buf = await r.arrayBuffer();
        size = buf.byteLength;
      } catch (_) {
        size = 0;
      }
    }

    const isGraphic = isLikelyGraphic(media?.mime_type, media?.source_url || url);
    const quality = isGraphic ? cfg.webpQualityGraphic : cfg.webpQualityPhoto;
    const estimated = estimateWebPSize(size || 0, isGraphic, quality);

    totalBytes += size || 0;
    estimatedTotal += estimated;
    perImage.push({ url, original: size || 0, estimated });

    // upsert inventory record (status pending)
    await upsertInventory({
      attachment_url: url,
      attachment_id: media?.id ?? null,
      filename: media?.source_url?.split('/').pop() ?? null,
      mime_type: media?.mime_type ?? null,
      file_size_bytes: size ?? null,
      sha256: null,
      metadata: media ?? null,
      status: 'pending',
    } as any);
  }

  const summary: DryRunSummary = {
    total_images: perImage.length,
    total_bytes: totalBytes,
    estimated_webp_bytes: estimatedTotal,
    estimated_savings: Math.max(0, totalBytes - estimatedTotal),
    per_image: perImage,
  };

  // persist snapshot to config
  try {
    await upsertConfig('dry_run:latest', summary);
  } catch (err) {
    // ignore persistence errors for now
  }

  return summary;
}
