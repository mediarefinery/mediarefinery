# MediaRefinery

A batch pipeline to optimize historical WordPress images by converting them to modern formats (WebP, optional AVIF) and rewriting posts to reference the optimized variants.

This repository contains an external worker and dashboard approach that inventories referenced images, produces a dry-run savings report, converts images using Sharp/libvips, uploads optimized variants via the WordPress REST API (leveraging existing Azure offload plugins), records a reversible mapping, and provides a Next.js dashboard for monitoring and control.

## Goals (MVP)

- Dry-run sizing and savings report
- Convert historical JPEG/PNG to WebP using new filenames (`<basename>__opt.webp`)
- Optional AVIF generation behind a toggle (code present, off by default)
- Preserve alt text and captions; update featured images
- Maintain mapping for 90 days to allow rollback
- Phased rollout support (author/date filters) and low-traffic scheduling

## Quickstart (local dev)

1. Copy env example

```bash
cp .env.example .env
```

2. Install dependencies

```bash
npm install
```

3. Start local dev (worker + dashboard)

```bash
npm run dev
```

Note: Worker and dashboard may run as separate processes (e.g., `npm run dev:worker` and `npm run dev:dashboard`) depending on the scaffold.

Optional quick verification

```bash
# install (if not already done)
npm install

# typecheck (will use placeholders if no source yet)
npx tsc --noEmit

# run lint and format checks
npm run lint || true
npm run format

# run tests (no tests yet)
npm test
```

## Environment Variables

Create a `.env` file with at least the following keys (use `.env.example` for guidance):

- `WP_BASE_URL` - WordPress site base URL (no trailing slash)
- `WP_APP_USER` - Username for Application Password
- `WP_APP_PASSWORD` - Application Password (store securely)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key (dashboard only)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (worker DB writes)
- `MAX_WIDTH` - Default maximum width for downscale (default 2560)
- `WEBP_QUALITY_PHOTO` - Default WebP quality for photos (default 75)
- `WEBP_QUALITY_GRAPHIC` - WebP quality for small graphics (default 85)
- `PRESERVE_ICC` - `auto|always|never` (default `auto`)
- `AVIF_ENABLED` - `true|false` (default `false`)
- `CONCURRENCY_BASE` - default parallel conversions (default 3)
- `CONCURRENCY_MAX` - max adaptive concurrency (default 5)
- `SCHEDULE_START_HHMM` - optional start time (24h site timezone)
- `SCHEDULE_END_HHMM` - optional end time (24h site timezone)

## Development Notes

- Tests: `npx jest`
- Linting: `npm run lint`
- Format: `npm run format`

## Next steps

- Scaffold project (package.json, tsconfig, basic source layout)
- Implement Supabase schema and migrations
- Build inventory and dry-run pipeline

## Operational notes

- The default approach writes new filenames and does not delete original files.
- AVIF is off by default to avoid unintentional rollouts; enabling requires operator confirmation.
- Dry-run should be executed and reviewed before any rewrite/upsert operations.

## Contact

Project owner: TBD
