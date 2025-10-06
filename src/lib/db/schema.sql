-- src/lib/db/schema.sql
-- DDL for MediaRefinery (same as supabase migration 0001)

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

CREATE TABLE IF NOT EXISTS post_rewrites (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL,
  original_content TEXT,
  rewritten_content TEXT,
  mapping JSONB,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  applied_by TEXT
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_inventory_sha256 ON media_inventory (sha256);
CREATE INDEX IF NOT EXISTS idx_media_inventory_status ON media_inventory (status);
CREATE INDEX IF NOT EXISTS idx_media_inventory_discovered_at ON media_inventory (discovered_at);
CREATE INDEX IF NOT EXISTS idx_media_inventory_author_date ON media_inventory ((metadata->>'author'), discovered_at);
CREATE INDEX IF NOT EXISTS idx_media_optimization_inventory_id ON media_optimization (inventory_id);
CREATE INDEX IF NOT EXISTS idx_post_rewrites_post_id ON post_rewrites (post_id);
