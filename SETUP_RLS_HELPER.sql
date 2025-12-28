-- ============================================
-- RLS Policy Helper Function
-- ============================================
-- Run this SQL in your SOURCE Supabase project's SQL Editor
-- to enable automatic RLS policy fetching
-- ============================================

CREATE OR REPLACE FUNCTION get_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  cmd text,
  qual text,
  with_check text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.schemaname::text,
    p.tablename::text,
    p.policyname::text,
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_policies() TO service_role;

-- Test the function
SELECT * FROM get_policies();
