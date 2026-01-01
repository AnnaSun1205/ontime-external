# How to Verify Jitter is Working

## Method 1: Check Schedule Table (Simplest)

Run this SQL in Supabase SQL Editor:

```sql
-- Check current schedule and timing
SELECT 
  function_name,
  last_run_at,
  next_run_at,
  last_status,
  -- Calculate minutes until next run
  ROUND(EXTRACT(EPOCH FROM (next_run_at - now())) / 60, 1) AS minutes_until_next_run,
  -- Calculate minutes since last run (if exists)
  CASE 
    WHEN last_run_at IS NOT NULL 
    THEN ROUND(EXTRACT(EPOCH FROM (now() - last_run_at)) / 60, 1)
    ELSE NULL
  END AS minutes_since_last_run
FROM public.refresh_schedule
WHERE function_name = 'refresh_opening_signals';
```

**What to look for:**
- `minutes_until_next_run` should be between 10-15 minutes (jitter range)
- After each execution, `next_run_at` should change to a new random time
- `last_run_at` should update each time the function actually runs

## Method 2: Check Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → `refresh_opening_signals` → **Logs**
2. Look for log entries with timestamps
3. Check the time difference between actual executions (not skipped ones)

**What to look for:**
- Logs showing `⏳ Not time to run yet` (skipped calls)
- Logs showing `🎉 Script completed successfully!` (actual executions)
- Time between actual executions should vary (10-15 minutes, not exactly 15)

## Method 3: Query Execution History (If logging table exists)

If you run the `create_refresh_execution_log.sql` migration, you can track all executions:

```sql
-- See execution intervals
SELECT 
  execution_time,
  status,
  next_run_at,
  -- Calculate interval since previous execution
  ROUND(EXTRACT(EPOCH FROM (
    execution_time - LAG(execution_time) OVER (ORDER BY execution_time)
  )) / 60, 1) AS minutes_since_previous
FROM public.refresh_execution_log
WHERE function_name = 'refresh_opening_signals'
  AND status = 'executed'  -- Only actual executions, not skips
ORDER BY execution_time DESC
LIMIT 10;
```

**What to look for:**
- `minutes_since_previous` should vary between 10-15 minutes
- Should NOT be exactly 15 minutes every time

## Method 4: Monitor in Real-Time

Run this query multiple times over an hour:

```sql
SELECT 
  now() AS current_time,
  last_run_at,
  next_run_at,
  ROUND(EXTRACT(EPOCH FROM (next_run_at - now())) / 60, 1) AS minutes_until_next
FROM public.refresh_schedule
WHERE function_name = 'refresh_opening_signals';
```

**What to look for:**
- `minutes_until_next` should decrease over time
- When it reaches 0, the function should execute
- After execution, `next_run_at` should jump to a new random time (10-15 min)

## Expected Behavior

✅ **Jitter Working:**
- Executions happen at 10-15 minute intervals (varies)
- `next_run_at` changes to a random time after each execution
- Time between executions is NOT always exactly 15 minutes

❌ **Jitter NOT Working:**
- Executions always happen at exactly 15 minutes
- `next_run_at` is always exactly 15 minutes from last run
- No variation in timing

