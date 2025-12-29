# Posted Date Implementation for Job Listings

## Overview
Implemented support for sorting listings by actual job posted/open date (from SimplifyJobs "Age" column) instead of scrape time.

## Changes Made

### 1. Database Schema Migration
**File:** `supabase/migrations/add_posted_at_to_opening_signals.sql`

- Added `posted_at` (timestamptz) column - when job was actually posted
- Added `age_days` (int) column - age of job in days (e.g., 0, 3, 5)
- Created index on `posted_at` for efficient sorting

**To apply:** Run this SQL in Supabase SQL Editor.

### 2. Edge Function Updates
**File:** `supabase/functions/refresh_opening_signals/index.ts`

**Changes:**
- Updated `ParsedRow` interface to include `age_days` and `posted_at`
- Added "Age" column detection in HTML table parsing
- Parses age formats:
  - `"0d"`, `"3d"`, `"5d"` → converts to `age_days` and calculates `posted_at`
  - Actual dates → parses and calculates `age_days`
- Includes `posted_at` and `age_days` in upsert records

**Age Parsing Logic:**
```typescript
// If age is "0d", "3d", etc.
const ageMatch = ageCell.match(/^(\d+)d?$/i);
if (ageMatch) {
  ageDays = parseInt(ageMatch[1], 10);
  postedAt = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000).toISOString();
}
```

### 3. Frontend ListingsTab Updates
**File:** `src/pages/app/ListingsTab.tsx`

**Changes:**
- Updated query to select `posted_at` and `age_days`
- Changed ordering to:
  1. Primary: `posted_at DESC` (newest jobs first, nulls last)
  2. Fallback: `last_seen_at DESC` (if `posted_at` is null)

**Query:**
```typescript
.select('id, company_name, role_title, location, term, apply_url, posted_at, age_days, last_seen_at, is_active')
.order('posted_at', { ascending: false, nullsFirst: false })
.order('last_seen_at', { ascending: false })
```

## Deployment Steps

### 1. Run Database Migration
In Supabase SQL Editor, run:
```sql
-- File: supabase/migrations/add_posted_at_to_opening_signals.sql
ALTER TABLE public.opening_signals
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS age_days int;

CREATE INDEX IF NOT EXISTS idx_opening_signals_posted_at
  ON public.opening_signals (posted_at DESC NULLS LAST);
```

### 2. Deploy Edge Function
Deploy the updated `refresh_opening_signals` Edge Function:
- Copy updated `index.ts` to Supabase Dashboard
- Or use Supabase CLI: `supabase functions deploy refresh_opening_signals`

### 3. Frontend Auto-Deploys
Frontend changes are committed to `main` and will auto-deploy.

### 4. Trigger Refresh
After deployment, the next scheduled refresh (or manual trigger) will:
- Parse "Age" column from SimplifyJobs
- Populate `posted_at` and `age_days` for new listings
- Existing listings will have `posted_at = null` until next refresh

## Verification

### SQL Query
After refresh, verify data:
```sql
SELECT company_name, role_title, age_days, posted_at, last_seen_at
FROM public.opening_signals
WHERE is_active = true
ORDER BY posted_at DESC NULLS LAST, last_seen_at DESC
LIMIT 30;
```

**Expected:**
- New listings should have `posted_at` and `age_days` populated
- Listings should be sorted by `posted_at` (newest first)
- Listings without `posted_at` fall back to `last_seen_at` sorting

### Frontend Verification
1. Open Listings tab
2. Check that listings are sorted by actual posted date (0d first, then 1d, 2d, etc.)
3. Newest jobs should appear at the top

## Notes

- **Existing data:** Old listings will have `posted_at = null` until next refresh
- **Age format:** Supports "0d", "3d", "5d" format from SimplifyJobs
- **Date format:** Also supports actual date strings if provided
- **Fallback:** If age column is missing, `posted_at` remains null and sorting falls back to `last_seen_at`

## Files Changed

- `supabase/migrations/add_posted_at_to_opening_signals.sql` - Database schema
- `supabase/functions/refresh_opening_signals/index.ts` - Age parsing logic
- `src/pages/app/ListingsTab.tsx` - Frontend sorting

All changes committed and pushed to `main`.

