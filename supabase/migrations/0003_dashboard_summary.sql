-- Create a lightweight summary RPC for the dashboard to aggregate metrics in a single query
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS TABLE(
  optimized bigint,
  skipped bigint,
  total_original_bytes bigint,
  total_optimized_bytes bigint
) AS $$
  SELECT
    (SELECT count(*) FROM media_inventory WHERE status = 'optimized')::bigint AS optimized,
    (SELECT count(*) FROM media_inventory WHERE status = 'skipped')::bigint AS skipped,
    (SELECT coalesce(sum(file_size_bytes), 0) FROM media_inventory WHERE status = 'optimized')::bigint AS total_original_bytes,
    (
      SELECT coalesce(sum(min_bytes), 0) FROM (
        SELECT MIN(mo.file_size_bytes) AS min_bytes
        FROM media_optimization mo
        JOIN media_inventory mi ON mo.inventory_id = mi.id
        WHERE mi.status = 'optimized'
        GROUP BY mo.inventory_id
      ) s
    )::bigint AS total_optimized_bytes;
$$ LANGUAGE sql STABLE;
