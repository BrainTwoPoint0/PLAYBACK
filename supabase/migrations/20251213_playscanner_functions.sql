-- PLAYScanner Database Functions
-- Creates missing functions for cache management

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_entries', (SELECT COUNT(*) FROM playscanner_cache),
    'active_entries', (SELECT COUNT(*) FROM playscanner_cache WHERE expires_at > NOW()),
    'expired_entries', (SELECT COUNT(*) FROM playscanner_cache WHERE expires_at <= NOW()),
    'total_slots', (SELECT COALESCE(SUM(jsonb_array_length(slots::jsonb)), 0) FROM playscanner_cache WHERE expires_at > NOW()),
    'cities_covered', (SELECT COUNT(DISTINCT city) FROM playscanner_cache WHERE expires_at > NOW()),
    'date_range', json_build_object(
      'oldest', (SELECT MIN(date) FROM playscanner_cache WHERE expires_at > NOW()),
      'newest', (SELECT MAX(date) FROM playscanner_cache WHERE expires_at > NOW())
    ),
    'last_collection', (SELECT MAX(created_at) FROM playscanner_collection_log)
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM playscanner_cache
  WHERE expires_at <= NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_cache_stats() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO service_role;
