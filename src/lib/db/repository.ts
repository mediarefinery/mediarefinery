import { getSupabaseClient, MediaInventoryRow } from './index';

export type InventoryRecord = {
  id: number;
  attachment_url: string;
  attachment_id?: number | null;
  filename?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  sha256?: string | null;
  discovered_at?: string | null;
  status?: string | null;
  last_error?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type OptimizationRecord = {
  id: number;
  inventory_id: number;
  optimized_url: string;
  filename?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  format?: string | null;
  created_at?: string | null;
  notes?: Record<string, unknown> | null;
};

const TABLE_INVENTORY = 'media_inventory';
const TABLE_OPT = 'media_optimization';

export async function getInventoryById(id: number): Promise<InventoryRecord | null> {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from(TABLE_INVENTORY).select('*').eq('id', id).single();
  if (error) throw error;
  return data as InventoryRecord | null;
}

export async function findInventoryBySha256(sha256: string): Promise<InventoryRecord[]>
{
  const sb = getSupabaseClient();
  const { data, error } = await sb.from(TABLE_INVENTORY).select('*').eq('sha256', sha256);
  if (error) throw error;
  return data as InventoryRecord[];
}

export async function upsertInventory(row: MediaInventoryRow & { sha256?: string }) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from(TABLE_INVENTORY).upsert(row, { onConflict: 'attachment_url' }).select();
  if (error) throw error;
  return data;
}

export async function listPending(limit = 100) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from(TABLE_INVENTORY).select('*').eq('status', 'pending').limit(limit);
  if (error) throw error;
  return data as InventoryRecord[];
}

export async function updateInventoryStatus(id: number, status: string, lastError?: string | null) {
  const sb = getSupabaseClient();
  const payload: any = { status };
  if (lastError !== undefined) payload.last_error = lastError;
  const { data, error } = await sb.from(TABLE_INVENTORY).update(payload).eq('id', id).select();
  if (error) throw error;
  return data;
}

export async function insertOptimization(opt: Omit<OptimizationRecord, 'id' | 'created_at'>) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from(TABLE_OPT).insert(opt).select();
  if (error) throw error;
  return data as OptimizationRecord[];
}

export async function getOptimizationsByInventoryId(inventoryId: number) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from(TABLE_OPT).select('*').eq('inventory_id', inventoryId);
  if (error) throw error;
  return data as OptimizationRecord[];
}

export async function upsertConfig(key: string, value: any) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('config').upsert({ key, value }, { onConflict: 'key' }).select();
  if (error) throw error;
  return data;
}

export async function getConfig(key: string) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('config').select('value').eq('key', key).single();
  if (error) {
    // return null if not found or other non-fatal error
    throw error;
  }
  return data?.value ?? null;
}

// Post rewrites audit table helpers
export type PostRewriteRecord = {
  id?: number;
  post_id: number;
  original_url: string;
  optimized_url: string;
  field: string; // 'content' or 'featured_media' etc
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function insertPostRewrite(row: Omit<PostRewriteRecord, 'id' | 'created_at'>) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('post_rewrites').insert(row).select();
  if (error) throw error;
  return data as PostRewriteRecord[];
}

export async function getPostRewritesForPost(postId: number) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('post_rewrites').select('*').eq('post_id', postId);
  if (error) throw error;
  return data as PostRewriteRecord[];
}

// Audit logs helper (generic audit table)
export type AuditLogRecord = {
  id?: number;
  action: string;
  actor?: string | null;
  target_type?: string | null;
  target_id?: number | null;
  details?: Record<string, unknown> | null;
  created_at?: string | null;
};

export async function getAuditLogs({ limit = 50, cursor, action, since }: { limit?: number; cursor?: number; action?: string; since?: string }) {
  const sb = getSupabaseClient();
  let q = sb.from('audit_logs').select('*').order('id', { ascending: false }).limit(limit);
  if (cursor) q = q.lt('id', cursor);
  if (action) q = q.eq('action', action);
  if (since) q = q.gte('created_at', since);
  const { data, error } = await q;
  if (error) throw error;
  return data as AuditLogRecord[];
}
