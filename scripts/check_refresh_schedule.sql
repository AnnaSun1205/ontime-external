-- Query to check refresh schedule and execution history
-- Run this in Supabase SQL Editor to verify jitter is working

-- 1. Check current schedule
SELECT 
  function_name,
  last_run_at,
  next_run_at,
  last_status,
  updated_at,
  -- Calculate minutes until next run
  EXTRACT(EPOCH FROM (next_run_at - now())) / 60 AS minutes_until_next_run
FROM public.refresh_schedule
WHERE function_name = 'refresh_opening_signals';

-- 2. Check execution log (if table exists)
SELECT 
  execution_time,
  status,
  next_run_at,
  message,
  duration_ms,
  -- Calculate interval between executions
  EXTRACT(EPOCH FROM (execution_time - LAG(execution_time) OVER (ORDER BY execution_time))) / 60 AS minutes_since_previous
FROM public.refresh_execution_log
WHERE function_name = 'refresh_opening_signals'
ORDER BY execution_time DESC
LIMIT 20;

-- 3. Summary statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (execution_time - LAG(execution_time) OVER (ORDER BY execution_time))) / 60) as avg_minutes_between,
  MIN(EXTRACT(EPOCH FROM (execution_time - LAG(execution_time) OVER (ORDER BY execution_time))) / 60) as min_minutes_between,
  MAX(EXTRACT(EPOCH FROM (execution_time - LAG(execution_time) OVER (ORDER BY execution_time))) / 60) as max_minutes_between
FROM public.refresh_execution_log
WHERE function_name = 'refresh_opening_signals'
  AND execution_time >= now() - interval '24 hours'
GROUP BY status;

