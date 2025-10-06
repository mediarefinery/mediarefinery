import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, loadConfig } from '../../config';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;
  // ensure configuration is loaded (this will attempt to read dotenv if not loaded yet)
  try {
    loadConfig();
  } catch (e) {
    // ignore here; below we'll check for required values and throw a consistent error
  }

  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
    return supabase;
  }
  throw new Error('Supabase configuration missing (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
}

export type MediaInventoryRow = {
  attachment_url: string;
  attachment_id?: number | null;
  filename?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  sha256?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function insertMediaInventory(row: MediaInventoryRow) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.from('media_inventory').insert(row).select();
  if (error) throw error;
  return data;
}
