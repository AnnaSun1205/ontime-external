-- Fix company name carry-forward: Auto-fix "Unknown" or blank company names using previous row
-- This is a safety net in case the scraper misses a continuation symbol

-- Create function to get the latest known company name for a given source + term
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
CREATE OR REPLACE FUNCTION fix_company_name_on_insert_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  fixed_company text;
BEGIN
  -- Check if company_name is blank, null, "Unknown", or a continuation symbol
  IF NEW.company_name IS NULL 
     OR TRIM(NEW.company_name) = ''
     OR LOWER(TRIM(NEW.company_name)) = 'unknown'
     OR NEW.company_name IN ('↳', '└', '→') THEN
    
    -- Get the latest known company name for this source + term
    fixed_company := get_latest_company_name(NEW.source, NEW.term);
    
    -- Only update if we found a valid company name
    IF fixed_company IS NOT NULL AND fixed_company != 'Unknown' THEN
      NEW.company_name := fixed_company;
      RAISE NOTICE 'Fixed company_name from "%" to "%" for source=%, term=%', 
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

-- Create trigger
CREATE TRIGGER fix_company_name_trigger
BEFORE INSERT OR UPDATE OF company_name ON public.opening_signals
FOR EACH ROW
EXECUTE FUNCTION fix_company_name_on_insert_update();

-- Add comment
COMMENT ON FUNCTION fix_company_name_on_insert_update() IS 
'Safety net: Auto-fixes blank, null, or "Unknown" company names by using the most recent known company name for the same source + term. This guards against scraper misses.';

COMMENT ON FUNCTION get_latest_company_name(text, text) IS 
'Returns the most recent non-Unknown company name for a given source + term combination, ordered by posted_at, created_at, last_seen_at.';

