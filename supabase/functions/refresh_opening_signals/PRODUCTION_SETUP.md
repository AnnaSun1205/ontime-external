# Production Setup Guide

## Pre-Flight Checklist

### 1. ✅ Verify Extensions

Run `supabase/migrations/check_extensions.sql` to check:
- pg_cron availability (if you want to use it)
- pg_net availability (required for HTTP calls)
- Your user privileges

### 2. ✅ Run Required Migrations

Execute these migrations in order:

```sql
-- 1. Add listing_hash column and unique index
-- File: supabase/migrations/add_listing_hash_to_opening_signals.sql

-- 2. Create RLS policies (frontend SELECT-only)
-- File: supabase/migrations/create_rls_policies_opening_signals.sql

-- 3. Add is_active column for stale listing tracking
-- File: supabase/migrations/add_is_active_to_opening_signals.sql
```

### 3. ✅ Deploy Edge Function

```bash
# Using Supabase CLI
supabase functions deploy refresh_opening_signals

# Or use Supabase Dashboard > Edge Functions > Deploy
```

### 4. ✅ Set Environment Variables

In Supabase Dashboard > Project Settings > Edge Functions:

- `SUPABASE_URL`: Your project URL (e.g., `https://YOUR_PROJECT.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Project Settings > API)

**⚠️ Security Note:** Never commit service role keys to git. Always use Supabase Dashboard secrets.

### 5. ✅ Test the Function

See `TESTING.md` for detailed testing instructions.

Quick test:
```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

### 6. ✅ Set Up Scheduling

Choose one approach based on your extension availability:

#### Option A: Supabase Dashboard Cron (Recommended if available)

1. Go to **Database** > **Cron Jobs**
2. Create new cron job:
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

#### Option B: pg_cron (If available and you have superuser)

1. Run `supabase/migrations/create_refresh_opening_signals_cron.sql`
2. Set database settings:
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT.supabase.co';
   ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR_SERVICE_ROLE_KEY';
   ```
3. Schedule the job:
   ```sql
   SELECT cron.schedule(
     'refresh_opening_signals_job',
     '*/15 * * * *',
     $$SELECT call_refresh_opening_signals_function()$$
   );
   ```

#### Option C: External Cron Service (No pg_cron needed)

Use GitHub Actions, Vercel Cron, or any external service:

**GitHub Actions Example** (`.github/workflows/refresh-signals.yml`):
```yaml
name: Refresh Opening Signals

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/refresh_opening_signals" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

**Vercel Cron Example** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/refresh-signals",
    "schedule": "*/15 * * * *"
  }]
}
```

Then create `api/refresh-signals.ts`:
```typescript
export default async function handler(req, res) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/functions/v1/refresh_opening_signals`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    }
  );
  const data = await response.json();
  res.json(data);
}
```

## Security Verification

### ✅ Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'opening_signals';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'opening_signals';

-- Test frontend access (should work)
-- Use anon key in your frontend - should be able to SELECT

-- Test service role access (should work)
-- Edge Function uses service role key - should be able to INSERT/UPDATE
```

### ✅ Verify Service Role Key Usage

- ✅ Service role key is ONLY in Edge Function environment variables
- ✅ Service role key is NOT in frontend code
- ✅ Service role key is NOT committed to git
- ✅ Frontend uses anon key only (read-only access)

### ✅ Verify Frontend Access

Your frontend should use:
- `VITE_SUPABASE_URL` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)

**Never** use service role key in frontend!

## Monitoring

### Check Function Execution

```sql
-- If using pg_net, check HTTP requests
SELECT 
  url,
  status_code,
  content->>'ok' as success,
  content->>'inserted' as inserted,
  content->>'updated' as updated,
  created_at
FROM net.http_response
WHERE url LIKE '%refresh_opening_signals%'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Data Freshness

```sql
-- Check when data was last updated
SELECT 
  MAX(last_seen_at) as last_refresh,
  COUNT(*) FILTER (WHERE last_seen_at >= now() - interval '1 hour') as recent_updates,
  COUNT(*) FILTER (WHERE is_active = true) as active_listings
FROM opening_signals;
```

### Check for Issues

```sql
-- Check for stale listings (should be marked inactive)
SELECT COUNT(*) 
FROM opening_signals 
WHERE last_seen_at < now() - interval '7 days' 
AND is_active = true;

-- Check for parsing errors (if logged to a table)
-- (Currently errors are only in function response debug field)
```

## Maintenance

### Update is_active Status

The trigger automatically updates `is_active` based on `last_seen_at`, but you can manually refresh:

```sql
SELECT update_opening_signals_is_active();
```

### Manual Refresh

```sql
-- If using pg_net function
SELECT refresh_opening_signals_via_edge_function();

-- Or call Edge Function directly via HTTP
```

### Troubleshooting

See `TESTING.md` for detailed troubleshooting steps.

## Rollback Plan

If something goes wrong:

1. **Disable cron job:**
   ```sql
   SELECT cron.unschedule('refresh_opening_signals_job');
   ```

2. **Check recent changes:**
   ```sql
   SELECT * FROM opening_signals 
   WHERE last_seen_at >= now() - interval '1 hour'
   ORDER BY last_seen_at DESC;
   ```

3. **Restore from backup** if needed (Supabase automatic backups)

4. **Fix issues** and re-enable cron job

