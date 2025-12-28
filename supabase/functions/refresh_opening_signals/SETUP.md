# Setup Guide: Automated Refresh of Opening Signals

This guide walks you through setting up automatic refresh of internship data every 15 minutes.

## Overview

The system consists of:
1. **Database Migration**: Adds `listing_hash` column for deduplication
2. **Edge Function**: Fetches data from SimplifyJobs and upserts to `opening_signals`
3. **Cron Job**: Schedules the Edge Function to run every 15 minutes

## Step 1: Run Database Migration

Run the migration to add the `listing_hash` column:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/add_listing_hash_to_opening_signals.sql
```

This will:
- Add `listing_hash` column to `opening_signals`
- Create a function to compute the hash
- Backfill existing rows
- Create a unique index on `listing_hash`

## Step 2: Deploy Edge Function

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
# npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy refresh_opening_signals
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `refresh_opening_signals`
5. Copy the contents of `supabase/functions/refresh_opening_signals/index.ts`
6. Paste into the editor and deploy

## Step 3: Set Environment Variables

In Supabase Dashboard:

1. Go to **Project Settings** > **Edge Functions**
2. Add these secrets:
   - `SUPABASE_URL`: Your project URL (e.g., `https://YOUR_PROJECT.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (found in **Project Settings** > **API**)

## Step 4: Test the Edge Function

Test the function manually to ensure it works:

### Using Supabase Dashboard:
1. Go to **Edge Functions** > `refresh_opening_signals`
2. Click **Invoke**
3. Check the response - should return `{ ok: true, inserted: n, updated: n }`

### Using cURL:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Step 5: Set Up Cron Job

### Option A: Using Supabase Dashboard (Easiest)

1. Go to **Database** > **Cron Jobs** (if available in your plan)
2. Create a new cron job:
   - **Name**: `refresh_opening_signals_job`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
   - **SQL**:
     ```sql
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
       ),
       body := '{}'::jsonb
     ) AS request_id;
     ```

### Option B: Using pg_cron (Advanced)

1. Run the migration:
   ```sql
   -- File: supabase/migrations/create_refresh_opening_signals_cron.sql
   ```

2. Set database settings:
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT.supabase.co';
   ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY';
   ```

3. Schedule the cron job:
   ```sql
   SELECT cron.schedule(
     'refresh_opening_signals_job',
     '*/15 * * * *',
     $$SELECT call_refresh_opening_signals_function()$$
   );
   ```

4. Verify the cron job:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'refresh_opening_signals_job';
   ```

## Step 6: Verify It's Working

1. Check the cron job logs in Supabase Dashboard
2. Query the `opening_signals` table to see if `last_seen_at` is being updated
3. Check Edge Function logs for any errors

## Troubleshooting

### Edge Function returns 500 error
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
- Check Edge Function logs in Supabase Dashboard

### Cron job not running
- Verify pg_cron extension is enabled
- Check cron job status: `SELECT * FROM cron.job;`
- Check cron job history: `SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_opening_signals_job');`

### No data being inserted/updated
- Check Edge Function logs
- Verify the GitHub URL is accessible
- Check that the `listing_hash` column exists and has data

## Security Notes

- **Never commit** `SUPABASE_SERVICE_ROLE_KEY` to git
- Use Supabase Dashboard secrets for environment variables
- The service role key has full database access - keep it secure
- Consider using Row Level Security (RLS) policies if needed

## Monitoring

You can monitor the refresh by:
1. Checking `opening_signals.last_seen_at` timestamps
2. Reviewing Edge Function logs in Supabase Dashboard
3. Querying cron job run history (if using pg_cron)

