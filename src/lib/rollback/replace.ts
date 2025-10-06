import * as cheerio from 'cheerio';

export type Replacement = {
  originalUrl: string;
  optimizedUrl: string;
  originalSrcAttr?: string; // 'src' or 'srcset' primary attribute used
};

/**
 * Perform a DOM-safe replacement of image URLs in an HTML string.
 * - Replaces exact matches in `src` attributes
 * - Rewrites individual entries in `srcset` lists when the candidate URL matches
 * - Returns the rewritten HTML and a list of replacements performed
 */
export function rewriteHtmlImageUrls(html: string, mapping: Replacement[]) {
  // cheerio types don't include the decodeEntities option in some versions — cast to any
  const $ = cheerio.load(html, ({ decodeEntities: false } as any));
  const replacements: Replacement[] = [];

  const mapByOriginal = new Map(mapping.map((m) => [m.originalUrl, m]));

  $('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (src && mapByOriginal.has(src)) {
      const m = mapByOriginal.get(src)!;
      $el.attr('src', m.optimizedUrl);
      replacements.push({ ...m, originalSrcAttr: 'src' });
    }

    const srcset = $el.attr('srcset');
    if (srcset) {
      // split on commas but be forgiving about whitespace
      const parts = srcset.split(',').map((s) => s.trim()).filter(Boolean);
      const newParts = parts.map((part) => {
        // each part: "<url> <descriptor>" or just "<url>"
        const [url, descriptor] = part.split(/\s+/, 2);
        if (mapByOriginal.has(url)) {
          const m = mapByOriginal.get(url)!;
          replacements.push({ ...m, originalSrcAttr: 'srcset' });
          return descriptor ? `${m.optimizedUrl} ${descriptor}` : m.optimizedUrl;
        }
        return part;
      });
      $el.attr('srcset', newParts.join(', '));
    }
  });

  return { html: $.html(), replacements };
}
