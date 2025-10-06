import { rewriteHtmlImageUrls } from '../../../src/lib/rollback/replace';
import { previewRewrites } from '../../../src/lib/rollback/preview';
import { restoreHtmlFromMapping } from '../../../src/lib/rollback/restore';

describe('rollback rewrite/preview/restore', () => {
  const original1 = 'https://cdn.example.com/uploads/2020/01/pic1.jpg';
  const optimized1 = 'https://cdn.example.com/uploads/2020/01/pic1__opt.webp';
  const original2 = 'https://cdn.example.com/uploads/2020/01/icon.svg';
  const optimized2 = 'https://cdn.example.com/uploads/2020/01/icon__opt.webp';

  const html = `
    <p>Intro</p>
    <img src="${original1}" alt="photo" />
    <img src="${original2}" srcset="${original2} 1x, ${original1} 2x" />
  `;

  test('rewriteHtmlImageUrls replaces src and entries in srcset', () => {
    const mapping = [
      { originalUrl: original1, optimizedUrl: optimized1 },
      { originalUrl: original2, optimizedUrl: optimized2 },
    ];

    const res = rewriteHtmlImageUrls(html, mapping);
  // There are four attribute occurrences replaced: src for original1, src for original2,
  // and two srcset entries (original2 1x, original1 2x)
  expect(res.replacements.length).toBe(4);
    expect(res.html).toContain(optimized1);
    expect(res.html).toContain(optimized2);
    // srcset should contain optimized1 as 2x
    expect(res.html).toMatch(new RegExp(`${optimized1} 2x`));
  });

  test('previewRewrites returns entries with rewrittenHtml', () => {
    const mapping = [{ originalUrl: original1, optimizedUrl: optimized1 }];
    const posts = [{ id: 42, html }];
    const previews = previewRewrites(posts, mapping);
    expect(previews.length).toBe(1);
    expect(previews[0].replacements.length).toBeGreaterThan(0);
  });

  test('restoreHtmlFromMapping reverts optimized urls back to original', () => {
    const mapping = [
      { originalUrl: original1, optimizedUrl: optimized1 },
      { originalUrl: original2, optimizedUrl: optimized2 },
    ];
    const { html: rewritten } = rewriteHtmlImageUrls(html, mapping);
    const restored = restoreHtmlFromMapping(rewritten, mapping);
    expect(restored).toContain(original1);
    expect(restored).toContain(original2);
    // ensure optimized urls are not present
    expect(restored).not.toContain(optimized1);
  });
});
