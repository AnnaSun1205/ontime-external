-- Utility script to clear stuck locks in refresh_schedule
-- Run this if a lock is stuck and preventing execution

-- Clear any expired locks (locked_until < now())
UPDATE public.refresh_schedule
SET 
  locked_until = NULL,
  locked_by = NULL,
  updated_at = now()
WHERE function_name = 'refresh_opening_signals'
  AND locked_until IS NOT NULL
  AND locked_until < now();

-- Or clear ALL locks (use with caution)
-- UPDATE public.refresh_schedule
-- SET 
--   locked_until = NULL,
--   locked_by = NULL,
--   updated_at = now()
-- WHERE function_name = 'refresh_opening_signals';

-- Check current lock status
SELECT 
  function_name,
  next_run_at,
  last_run_at,
  locked_until,
  locked_by,
  last_status,
  CASE 
    WHEN locked_until IS NULL THEN 'Not locked'
    WHEN locked_until < now() THEN 'Lock expired (should be cleared)'
    ELSE 'Locked'
  END as lock_status,
  CASE 
    WHEN locked_until IS NOT NULL AND locked_until >= now() 
    THEN EXTRACT(EPOCH FROM (locked_until - now())) / 60
    ELSE NULL
  END as minutes_until_lock_expires
FROM public.refresh_schedule
WHERE function_name = 'refresh_opening_signals';

