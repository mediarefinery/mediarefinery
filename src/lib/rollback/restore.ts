import * as cheerio from 'cheerio';
import type { Replacement } from './replace';

/**
 * Reverts optimized URLs back to their original URLs in an HTML string.
 * This expects mapping entries with originalUrl and optimizedUrl.
 */
export function restoreHtmlFromMapping(html: string, mapping: Replacement[]) {
  const $ = cheerio.load(html, ({ decodeEntities: false } as any));
  const mapByOptimized = new Map(mapping.map((m) => [m.optimizedUrl, m]));

  $('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (src && mapByOptimized.has(src)) {
      const m = mapByOptimized.get(src)!;
      $el.attr('src', m.originalUrl);
    }

    const srcset = $el.attr('srcset');
    if (srcset) {
      const parts = srcset.split(',').map((s) => s.trim()).filter(Boolean);
      const newParts = parts.map((part) => {
        const [url, descriptor] = part.split(/\s+/, 2);
        if (mapByOptimized.has(url)) {
          const m = mapByOptimized.get(url)!;
          return descriptor ? `${m.originalUrl} ${descriptor}` : m.originalUrl;
        }
        return part;
      });
      $el.attr('srcset', newParts.join(', '));
    }
  });

  return $.html();
}
