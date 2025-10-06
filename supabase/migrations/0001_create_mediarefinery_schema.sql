-- 0001_create_mediarefinery_schema.sql
-- Initial schema for MediaRefinery

BEGIN;

-- Inventory of discovered media references
CREATE TABLE IF NOT EXISTS media_inventory (
  id BIGSERIAL PRIMARY KEY,
  attachment_url TEXT NOT NULL,
  attachment_id BIGINT,
  filename TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  sha256 TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending',
  last_error TEXT,
  metadata JSONB
);

-- Records for each optimization produced
CREATE TABLE IF NOT EXISTS media_optimization (
  id BIGSERIAL PRIMARY KEY,
  inventory_id BIGINT REFERENCES media_inventory(id) ON DELETE CASCADE,
  optimized_url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes JSONB
);

-- Post rewrite audit records for reversible updates
CREATE TABLE IF NOT EXISTS post_rewrites (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL,
  original_content TEXT,
  rewritten_content TEXT,
  mapping JSONB,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  applied_by TEXT
);

-- Small config table for runtime toggles and snapshots
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMIT;
