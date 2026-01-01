# Scheduler Lock Implementation

## Overview
Implemented lease-based locking to prevent duplicate "real runs" in the `refresh_opening_signals` Edge Function. This ensures that even if multiple invocations overlap (slow run, retry, manual trigger + cron), only one instance will execute the heavy fetch/upsert work.

## Changes Made

### 1. Database Schema Changes

#### Migration: `add_lock_columns_refresh_schedule.sql`
- Added `locked_until timestamptz` column to track lock expiration
- Added `locked_by text` column to track which request holds the lock
- Created index on `locked_until` for efficient lock expiration checks

#### Migration: `create_acquire_refresh_lock_function.sql`
- Created RPC function `acquire_refresh_lock()` for atomic lock acquisition
- Function atomically checks:
  - `next_run_at` is null OR `now() >= next_run_at` (time to run)
  - `locked_until` is null OR `locked_until < now()` (not locked)
- If conditions are met, atomically sets `locked_until` and `locked_by`
- Returns `true` if lock acquired, `false` otherwise

#### Migration: `preserve_first_seen_at_trigger.sql`
- Ensures `first_seen_at` is only set on INSERT, never overwritten on UPDATE
- Trigger preserves existing `first_seen_at` value on UPDATE operations

### 2. Edge Function Changes

#### Atomic Lock Acquisition
- Before any heavy work, calls `acquire_refresh_lock()` RPC function
- Lock duration: 5 minutes
- Request ID: UUID generated per invocation
- If lock acquisition fails:
  - Returns `200` with `{ ok: true, skipped: true, reason: "locked" }`
  - Logs reason (not time yet, or locked by another instance)

#### Schedule Check Error Handling
- **First run** (table doesn't exist): Proceeds with execution
- **Other schedule read errors**: Does NOT run heavy work, returns `200` with `reason: "schedule_read_error"`

#### Lock Release on Success
- After successful execution, releases lock by setting:
  - `locked_until = null`
  - `locked_by = null`
- Updates schedule with `last_run_at`, `next_run_at`, `last_status = 'success'`

#### Lock Release on Failure
- On error, releases lock and schedules next run with backoff (20-40 minutes)
- Sets `last_status = 'failed'`
- If schedule update fails, attempts manual lock release as fallback

#### First Seen At Preservation
- Removed `first_seen_at` from upsert payload
- `first_seen_at` is now only set by DB trigger on INSERT
- On UPDATE (conflict), trigger preserves existing `first_seen_at` value

## How It Works

### Lock Acquisition Flow
1. Edge Function receives request
2. Generates unique `requestId` (UUID)
3. Calls `acquire_refresh_lock()` RPC function atomically:
   - Checks if it's time to run (`next_run_at`)
   - Checks if lock is available (`locked_until`)
   - If both conditions met, atomically sets lock
4. If lock acquired: proceed with heavy work
5. If lock not acquired: return `200` with skip reason

### Lock Release Flow
1. **On Success**:
   - Update schedule with success status
   - Set `locked_until = null`, `locked_by = null`
   - Schedule next run with jitter (10-15 minutes)

2. **On Failure**:
   - Update schedule with failure status
   - Set `locked_until = null`, `locked_by = null`
   - Schedule next run with backoff (20-40 minutes)
   - Fallback: manual lock release if schedule update fails

## Benefits

1. **Prevents Duplicate Runs**: Only one instance can acquire the lock at a time
2. **Atomic Operations**: Lock acquisition is atomic, preventing race conditions
3. **Automatic Lock Expiration**: 5-minute lock duration prevents deadlocks
4. **Graceful Degradation**: Handles first run and transient errors gracefully
5. **Data Integrity**: `first_seen_at` is preserved correctly on updates

## Deployment Steps

1. Run migration: `add_lock_columns_refresh_schedule.sql`
2. Run migration: `create_acquire_refresh_lock_function.sql`
3. Run migration: `preserve_first_seen_at_trigger.sql` (if not already exists)
4. Deploy updated Edge Function: `refresh_opening_signals`

## Testing

### Test Lock Acquisition
```sql
-- Check current lock status
SELECT function_name, next_run_at, locked_until, locked_by, last_status
FROM public.refresh_schedule
WHERE function_name = 'refresh_opening_signals';
```

### Test Lock Release
- Trigger Edge Function manually
- Verify lock is acquired during execution
- Verify lock is released after completion (success or failure)

### Test Concurrent Invocations
- Trigger Edge Function twice simultaneously
- Verify only one acquires lock
- Verify second returns `{ ok: true, skipped: true, reason: "locked" }`

