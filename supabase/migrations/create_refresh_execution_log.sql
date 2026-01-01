-- Optional: Create a table to log each execution for better tracking
CREATE TABLE IF NOT EXISTS public.refresh_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  execution_time timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('executed', 'skipped', 'failed')),
  next_run_at timestamptz,
  message text,
  duration_ms integer,
  inserted_count integer,
  updated_count integer,
  deactivated_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for querying execution history
CREATE INDEX IF NOT EXISTS idx_refresh_execution_log_function_time 
  ON public.refresh_execution_log(function_name, execution_time DESC);

-- Add comment
COMMENT ON TABLE public.refresh_execution_log IS 'Logs each execution attempt of refresh functions for monitoring jitter and timing';

