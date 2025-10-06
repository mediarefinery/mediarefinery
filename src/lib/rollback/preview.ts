import { rewriteHtmlImageUrls, Replacement } from './replace';

export type PreviewEntry = {
  postId?: number | string;
  originalHtml: string;
  rewrittenHtml: string;
  replacements: Replacement[];
};

/**
 * Generate a preview for a set of posts (html strings) given a mapping of original->optimized URLs.
 * Returns an array of preview entries with diffs (rewrittenHtml and list of replacements)
 */
export function previewRewrites(posts: { id?: number | string; html: string }[], mapping: Replacement[]) {
  return posts.map((p) => {
    const { html: rewrittenHtml, replacements } = rewriteHtmlImageUrls(p.html, mapping);
    return { postId: p.id, originalHtml: p.html, rewrittenHtml, replacements } as PreviewEntry;
  });
}
