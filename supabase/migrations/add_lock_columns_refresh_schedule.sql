-- Add lock columns to refresh_schedule table for concurrency control
-- This migration is idempotent - safe to run multiple times

-- Add lock columns if they don't exist
DO $$ 
BEGIN
  -- Add locked_until column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'refresh_schedule' 
    AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE public.refresh_schedule 
    ADD COLUMN locked_until timestamptz;
  END IF;

  -- Add locked_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'refresh_schedule' 
    AND column_name = 'locked_by'
  ) THEN
    ALTER TABLE public.refresh_schedule 
    ADD COLUMN locked_by text;
  END IF;
END $$;

-- Create index on locked_until for efficient lock expiration checks
CREATE INDEX IF NOT EXISTS idx_refresh_schedule_locked_until 
  ON public.refresh_schedule(locked_until) 
  WHERE locked_until IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.refresh_schedule.locked_until IS 'Lease lock expiration time. NULL means not locked.';
COMMENT ON COLUMN public.refresh_schedule.locked_by IS 'Request ID that acquired the lock (for debugging).';

