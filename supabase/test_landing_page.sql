-- Quick test queries for landing_page_config table

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'landing_page_config'
);

-- 2. Check if default record exists
SELECT COUNT(*) as record_count FROM landing_page_config;

-- 3. View current configuration
SELECT 
  id,
  hero_title,
  hero_subtitle,
  sections_visibility,
  created_at
FROM landing_page_config;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'landing_page_config';

-- 5. Check storage bucket
SELECT 
  id,
  name,
  public
FROM storage.buckets
WHERE id = 'public-assets';

-- 6. Check storage policies
SELECT 
  policyname,
  definition
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';
