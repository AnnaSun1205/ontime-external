-- Add posted_at and age_days columns to opening_signals for proper job age sorting
-- This allows sorting by when jobs were actually posted, not when we scraped them

ALTER TABLE public.opening_signals
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS age_days int;

-- Create index for efficient sorting by posted_at
CREATE INDEX IF NOT EXISTS idx_opening_signals_posted_at
  ON public.opening_signals (posted_at DESC NULLS LAST);

-- Add comment for documentation
COMMENT ON COLUMN public.opening_signals.posted_at IS 'When the job was actually posted/opened (from source data), not when we first scraped it';
COMMENT ON COLUMN public.opening_signals.age_days IS 'Age of the job posting in days (from source data like "0d", "3d")';

