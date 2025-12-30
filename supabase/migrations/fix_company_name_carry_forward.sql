-- Fix company name carry-forward: Auto-fix "Unknown" or blank company names
-- NOTE: This trigger is a LAST RESORT safety net. The primary fix is in the scraper
-- which uses original_index (DOM order) to fill-down company names BEFORE upsert.
-- This trigger only handles edge cases where company_name is still blank/null/Unknown.

-- Create function to get the latest known company name for a given source + term
-- WARNING: This uses database order (posted_at/created_at), not original DOM order.
-- The scraper should handle fill-down using original_index BEFORE this trigger runs.
CREATE OR REPLACE FUNCTION get_latest_company_name(
  p_source text,
  p_term text
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  latest_company text;
BEGIN
  -- Get the most recent non-Unknown, non-blank company_name for this source + term
  -- NOTE: This is a fallback only - scraper should have already filled company names
  SELECT company_name INTO latest_company
  FROM public.opening_signals
  WHERE source = p_source
    AND term = p_term
    AND company_name IS NOT NULL
    AND company_name != ''
    AND LOWER(TRIM(company_name)) != 'unknown'
    AND company_name NOT IN ('↳', '└', '→')
  ORDER BY 
    posted_at DESC NULLS LAST,
    created_at DESC,
    last_seen_at DESC
  LIMIT 1;
  
  RETURN COALESCE(latest_company, 'Unknown');
END;
$$;

-- Create trigger function to auto-fix company names on insert/update
-- This is a LAST RESORT - scraper should have already handled fill-down using original_index
CREATE OR REPLACE FUNCTION fix_company_name_on_insert_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  fixed_company text;
BEGIN
  -- Only fix if company_name is still blank, null, "Unknown", or a continuation symbol
  -- This should rarely happen if scraper fill-down works correctly
  IF NEW.company_name IS NULL 
     OR TRIM(NEW.company_name) = ''
     OR LOWER(TRIM(NEW.company_name)) = 'unknown'
     OR NEW.company_name IN ('↳', '└', '→') THEN
    
    -- Get the latest known company name for this source + term
    -- WARNING: This uses database order, not original DOM order
    fixed_company := get_latest_company_name(NEW.source, NEW.term);
    
    -- Only update if we found a valid company name
    IF fixed_company IS NOT NULL AND fixed_company != 'Unknown' THEN
      NEW.company_name := fixed_company;
      RAISE NOTICE 'Fixed company_name from "%" to "%" for source=%, term=% (fallback trigger)', 
        COALESCE(NEW.company_name, 'NULL'), fixed_company, NEW.source, NEW.term;
    ELSE
      -- Last resort: set to "Unknown" if no previous company found
      NEW.company_name := 'Unknown';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS fix_company_name_trigger ON public.opening_signals;

-- Create trigger (LAST RESORT safety net)
CREATE TRIGGER fix_company_name_trigger
BEFORE INSERT OR UPDATE OF company_name ON public.opening_signals
FOR EACH ROW
EXECUTE FUNCTION fix_company_name_on_insert_update();

-- Add comment
COMMENT ON FUNCTION fix_company_name_on_insert_update() IS 
'LAST RESORT safety net: Auto-fixes blank, null, or "Unknown" company names. Primary fix is in scraper using original_index (DOM order) for fill-down BEFORE upsert. This trigger only handles edge cases.';

COMMENT ON FUNCTION get_latest_company_name(text, text) IS 
'Returns the most recent non-Unknown company name for a given source + term. WARNING: Uses database order, not original DOM order. Scraper should handle fill-down using original_index.';

