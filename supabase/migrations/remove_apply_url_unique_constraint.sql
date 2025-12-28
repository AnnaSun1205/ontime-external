-- Remove unique constraint on apply_url from opening_signals
-- We now use listing_hash as the unique key for upserts instead

-- Drop the unique constraint on apply_url if it exists
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'opening_signals_apply_url_unique'
    ) THEN
        ALTER TABLE public.opening_signals
        DROP CONSTRAINT opening_signals_apply_url_unique;
        RAISE NOTICE '✅ Dropped unique constraint on apply_url';
    ELSE
        RAISE NOTICE '⚠️  Constraint opening_signals_apply_url_unique not found (may have different name)';
    END IF;
    
    -- Also check for any unique index on apply_url
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'opening_signals' 
        AND indexname LIKE '%apply_url%unique%'
    ) THEN
        -- Find and drop the index
        DECLARE
            idx_name text;
        BEGIN
            SELECT indexname INTO idx_name
            FROM pg_indexes 
            WHERE tablename = 'opening_signals' 
            AND indexname LIKE '%apply_url%unique%'
            LIMIT 1;
            
            IF idx_name IS NOT NULL THEN
                EXECUTE 'DROP INDEX IF EXISTS ' || idx_name;
                RAISE NOTICE '✅ Dropped unique index on apply_url: %', idx_name;
            END IF;
        END;
    END IF;
END $$;

-- Verify listing_hash unique constraint exists (should already exist from add_listing_hash_to_opening_signals.sql)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'opening_signals' 
        AND indexname = 'opening_signals_listing_hash_idx'
    ) THEN
        RAISE WARNING '⚠️  Unique index on listing_hash not found. Please run add_listing_hash_to_opening_signals.sql migration first.';
    ELSE
        RAISE NOTICE '✅ Unique index on listing_hash exists';
    END IF;
END $$;

COMMENT ON TABLE public.opening_signals IS 
'Opening signals table. Uses listing_hash as unique key for upserts. apply_url is no longer unique (multiple roles from same company can share apply_url).';

