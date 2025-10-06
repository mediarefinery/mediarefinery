import path from 'path';
import { resolveMediaForUrls } from '../wordpress/resolve';

export async function generateUniqueFilename(originalUrl: string, ext = '.webp') {
  const parsed = new URL(originalUrl);
  const base = path.basename(parsed.pathname);
  const name = base.replace(/\.[^.]+$/, '');
  let candidate = `${name}__opt${ext}`;

  // quick check: resolve media for candidate names to detect collisions
  const tryUrls = [candidate];
  const found = await resolveMediaForUrls(tryUrls);
  if (!found.get(candidate)) return candidate;

  // append numeric suffixes until unique
  for (let i = 1; i < 100; i++) {
    const c = `${name}__opt_${i}${ext}`;
    const f = await resolveMediaForUrls([c]);
    if (!f.get(c)) return c;
  }

  // fallback: include timestamp
  return `${name}__opt_${Date.now()}${ext}`;
}
