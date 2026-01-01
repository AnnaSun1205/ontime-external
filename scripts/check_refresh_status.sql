-- Quick status check for refresh_opening_signals
-- Run this in Supabase SQL Editor

-- 1. Current schedule status
SELECT 
  function_name,
  last_run_at,
  next_run_at,
  last_status,
  updated_at,
  -- Calculate timing
  ROUND(EXTRACT(EPOCH FROM (next_run_at - now())) / 60, 1) AS minutes_until_next_run,
  CASE 
    WHEN last_run_at IS NOT NULL 
    THEN ROUND(EXTRACT(EPOCH FROM (now() - last_run_at)) / 60, 1)
    ELSE NULL
  END AS minutes_since_last_run
FROM public.refresh_schedule
WHERE function_name = 'refresh_opening_signals';

-- 2. Check recent Edge Function logs for errors
-- (This requires checking Supabase Dashboard → Edge Functions → Logs)
-- Look for:
--   - "❌ Error:" messages
--   - "🎉 Script completed successfully!" (success)
--   - "⏳ Not time to run yet" (skipped)

-- 3. Verify jitter is working:
-- After a SUCCESSFUL run, next_run_at should be:
--   - 10-15 minutes from now (normal jitter)
-- After a FAILED run, next_run_at should be:
--   - 20-40 minutes from now (failure backoff)

