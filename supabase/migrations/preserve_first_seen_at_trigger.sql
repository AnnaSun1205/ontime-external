-- Create trigger to preserve first_seen_at on UPDATE
-- This ensures first_seen_at is only set on INSERT, never overwritten on UPDATE

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS preserve_opening_signals_first_seen_at_trigger ON public.opening_signals;

-- Create function to preserve first_seen_at
CREATE OR REPLACE FUNCTION public.preserve_opening_signals_first_seen_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- On UPDATE, preserve the existing first_seen_at if it exists
  -- On INSERT, allow NEW.first_seen_at to be set (or use default)
  IF TG_OP = 'UPDATE' AND OLD.first_seen_at IS NOT NULL THEN
    NEW.first_seen_at := OLD.first_seen_at;
  ELSIF TG_OP = 'INSERT' AND NEW.first_seen_at IS NULL THEN
    -- Set first_seen_at to now() if not provided on INSERT
    NEW.first_seen_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER preserve_opening_signals_first_seen_at_trigger
  BEFORE INSERT OR UPDATE ON public.opening_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.preserve_opening_signals_first_seen_at();

-- Add comment
COMMENT ON FUNCTION public.preserve_opening_signals_first_seen_at IS 'Preserves first_seen_at on UPDATE (only set on INSERT)';

