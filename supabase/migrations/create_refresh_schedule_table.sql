-- Create table to track refresh execution schedule with jitter
CREATE TABLE IF NOT EXISTS public.refresh_schedule (
  function_name text PRIMARY KEY,
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  last_status text CHECK (last_status IN ('success', 'failed', 'skipped', 'pending')),
  locked_until timestamptz,
  locked_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on next_run_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_refresh_schedule_next_run_at 
  ON public.refresh_schedule(next_run_at);

-- Add comment
COMMENT ON TABLE public.refresh_schedule IS 'Tracks execution schedule for Edge Functions with randomized jitter';

-- Initialize with first run time (if not exists)
INSERT INTO public.refresh_schedule (function_name, next_run_at, last_status)
VALUES ('refresh_opening_signals', now(), 'pending')
ON CONFLICT (function_name) DO NOTHING;

