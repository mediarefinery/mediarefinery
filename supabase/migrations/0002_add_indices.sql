-- 0002_add_indices.sql
-- Add indexes to improve query performance on common filters and joins

BEGIN;

-- Index to speed up dedupe and lookups by hash
CREATE INDEX IF NOT EXISTS idx_media_inventory_sha256 ON media_inventory (sha256);

-- Index for status-based queries (pending, optimized, skipped)
CREATE INDEX IF NOT EXISTS idx_media_inventory_status ON media_inventory (status);

-- Index for discovered date range queries
CREATE INDEX IF NOT EXISTS idx_media_inventory_discovered_at ON media_inventory (discovered_at);

-- Expression index to speed up author/date composite filters when author is stored in metadata JSONB
CREATE INDEX IF NOT EXISTS idx_media_inventory_author_date ON media_inventory ((metadata->>'author'), discovered_at);

-- Indexes to accelerate joins
CREATE INDEX IF NOT EXISTS idx_media_optimization_inventory_id ON media_optimization (inventory_id);
CREATE INDEX IF NOT EXISTS idx_post_rewrites_post_id ON post_rewrites (post_id);

COMMIT;
