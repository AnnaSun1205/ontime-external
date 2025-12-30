# Next Steps: Complete Pipeline Setup

## ✅ Current Status

- Edge Function is deployed and running successfully
- Company name fill-down using `original_index` (DOM order) is working
- Verification checks are in place
- Age parsing and `posted_at` calculation are working correctly

## 📋 Required Next Steps

### 1. Run Database Migration: Unique Index on `apply_url` ⚠️ **REQUIRED**

**File:** `supabase/migrations/add_unique_index_apply_url.sql`

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. First, check for existing duplicates:
   ```sql
   SELECT apply_url, COUNT(*) 
   FROM public.opening_signals 
   WHERE apply_url IS NOT NULL 
   GROUP BY apply_url 
   HAVING COUNT(*) > 1;
   ```
3. If duplicates exist, resolve them first (keep the most recent row per `apply_url`)
4. Copy and run the migration file contents
5. Verify the index was created:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE indexname = 'opening_signals_apply_url_unique_idx';
   ```

**Why:** This ensures one row per job URL and prevents duplicates.

---

### 2. Verify Data Integrity in Database ✅

Run these verification queries:

```sql
-- Check 1: No duplicate apply_urls (should return 0 rows)
SELECT apply_url, COUNT(*) 
FROM public.opening_signals 
WHERE apply_url IS NOT NULL 
GROUP BY apply_url 
HAVING COUNT(*) > 1;

-- Check 2: No apply_url → company_name conflicts (should return 0 rows)
SELECT apply_url
FROM public.opening_signals
WHERE apply_url IS NOT NULL
GROUP BY apply_url
HAVING COUNT(DISTINCT company_name) > 1;

-- Check 3: All active rows have posted_at and age_days
SELECT 
  COUNT(*) as total,
  COUNT(posted_at) as has_posted_at,
  COUNT(age_days) as has_age_days,
  COUNT(*) FILTER (WHERE posted_at IS NOT NULL AND age_days IS NOT NULL) as both_set
FROM public.opening_signals
WHERE is_active = true;

-- Check 4: Sample company-URL pairs (verify they match Simplify)
SELECT company_name, apply_url, posted_at, age_days
FROM public.opening_signals
WHERE is_active = true
ORDER BY posted_at DESC NULLS LAST, last_seen_at DESC
LIMIT 20;
```

**Expected Results:**
- Check 1: 0 rows (no duplicates)
- Check 2: 0 rows (no conflicts)
- Check 3: `both_set` should equal `total` (all have both fields)
- Check 4: Company-URL pairs should match Simplify's data

---

### 3. Set Up Automatic Refresh (Cron Job) ⚠️ **REQUIRED**

Choose one option:

#### Option A: Supabase Dashboard Cron (Easiest)

1. Go to **Database** → **Cron Jobs** (if available in your plan)
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
   - Replace `YOUR_PROJECT` and `YOUR_SERVICE_ROLE_KEY` with actual values

#### Option B: External Cron Service (GitHub Actions)

Create `.github/workflows/refresh-signals.yml`:

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

Add secrets to GitHub:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

#### Option C: Manual Testing First

Test manually before setting up cron:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 4. Verify Frontend is Working ✅

1. **Check Listings Tab:**
   - Open the app and navigate to Listings tab
   - Verify jobs are displayed (not mock data)
   - Check that jobs are ordered by `posted_at` (newest first)
   - Verify search functionality works
   - Check that inactive jobs are not shown

2. **Verify Data:**
   - Check that company names match Simplify
   - Verify apply URLs work
   - Confirm dates are displayed correctly

---

### 5. Monitor and Test

#### Monitor Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → `refresh_opening_signals`
2. Check logs for:
   - ✅ Successful runs
   - ⚠️ Warnings (non-fatal)
   - ❌ Errors (fatal)

#### Test Verification Checks

After a refresh, check the debug response includes:
```json
{
  "ok": true,
  "debug": {
    "verification": {
      "company_url_alignment": { "isValid": true },
      "post_dedup": { "isValid": true },
      "database_check": { "isValid": true }
    }
  }
}
```

#### Verify Stale Cleanup

After 48 hours, check that old listings are marked inactive:
```sql
SELECT COUNT(*) 
FROM public.opening_signals 
WHERE is_active = false 
AND last_seen_at < now() - interval '48 hours';
```

---

## 🎯 Success Criteria

- ✅ Unique index on `apply_url` is created
- ✅ No duplicate `apply_url`s in database
- ✅ No company-URL conflicts
- ✅ All active rows have `posted_at` and `age_days`
- ✅ Cron job is running every 15 minutes
- ✅ Frontend displays real data correctly
- ✅ New jobs appear at the top
- ✅ Inactive jobs are filtered out

---

## 🐛 Troubleshooting

### If migration fails due to duplicates:

```sql
-- Find duplicates
SELECT apply_url, COUNT(*), array_agg(id)
FROM public.opening_signals
WHERE apply_url IS NOT NULL
GROUP BY apply_url
HAVING COUNT(*) > 1;

-- Keep most recent, delete others (adjust as needed)
DELETE FROM public.opening_signals
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY apply_url ORDER BY last_seen_at DESC) as rn
    FROM public.opening_signals
    WHERE apply_url IS NOT NULL
  ) ranked
  WHERE rn > 1
);
```

### If cron job doesn't run:

- Check Supabase plan supports cron jobs
- Verify service role key is correct
- Check Edge Function logs for errors
- Try manual invocation first

### If frontend shows no data:

- Check RLS policies are correct
- Verify `is_active = true` filter
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

---

## 📝 Summary

**Priority Order:**
1. **Run unique index migration** (prevents duplicates)
2. **Verify data integrity** (confirm everything is correct)
3. **Set up cron job** (automate refresh)
4. **Test frontend** (ensure users see correct data)
5. **Monitor** (watch for issues)

Once all steps are complete, your pipeline will be fully automated and production-ready! 🚀

