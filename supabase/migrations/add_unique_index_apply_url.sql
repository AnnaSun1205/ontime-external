-- Add unique index on apply_url to guarantee one row per job URL
-- This prevents historical duplicates and silent company mismatches
-- The unique constraint ensures upsert conflicts on apply_url

-- First, check if there are any existing duplicates
-- If duplicates exist, we need to handle them before adding the unique constraint
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  -- Count duplicate apply_urls
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT apply_url
    FROM public.opening_signals
    WHERE apply_url IS NOT NULL
    GROUP BY apply_url
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate apply_url(s). These must be resolved before adding unique constraint.', duplicate_count;
    RAISE WARNING 'Run this query to see duplicates: SELECT apply_url, COUNT(*) FROM public.opening_signals WHERE apply_url IS NOT NULL GROUP BY apply_url HAVING COUNT(*) > 1;';
  END IF;
END $$;

-- Drop existing index if it exists (non-unique)
DROP INDEX IF EXISTS opening_signals_apply_url_idx;

-- Create unique index on apply_url
-- This will fail if duplicates exist, so resolve them first
CREATE UNIQUE INDEX IF NOT EXISTS opening_signals_apply_url_unique_idx
ON public.opening_signals (apply_url)
WHERE apply_url IS NOT NULL;  -- Partial index: only index non-null apply_urls

-- Add comment
COMMENT ON INDEX opening_signals_apply_url_unique_idx IS 
'Unique index on apply_url to guarantee one row per job URL. Prevents duplicates and ensures upsert conflicts on apply_url. Partial index (only non-null apply_urls).';

-- Verify the index was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'opening_signals_apply_url_unique_idx'
  ) THEN
    RAISE NOTICE '✅ Unique index on apply_url created successfully';
  ELSE
    RAISE WARNING '⚠️ Unique index on apply_url may not have been created';
  END IF;
END $$;

