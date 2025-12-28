# Fix apply_url Unique Constraint Error

## Problem

The Edge Function is failing with:
```
duplicate key value violates unique constraint "opening_signals_apply_url_unique"
```

This happens because the database still has a unique constraint on `apply_url`, but we're now using `listing_hash` as the unique key for upserts.

## Solution

Run the migration to remove the `apply_url` unique constraint:

**File**: `supabase/migrations/remove_apply_url_unique_constraint.sql`

### Steps

1. **Run the migration in Supabase SQL Editor:**
   - Go to Supabase Dashboard > SQL Editor
   - Copy the contents of `supabase/migrations/remove_apply_url_unique_constraint.sql`
   - Paste and run

2. **Verify the constraint is removed:**
   ```sql
   -- Check constraints on opening_signals
   SELECT conname, contype 
   FROM pg_constraint 
   WHERE conrelid = 'public.opening_signals'::regclass
   AND conname LIKE '%apply_url%';
   
   -- Should return no rows (or only non-unique indexes)
   ```

3. **Verify listing_hash constraint exists:**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'opening_signals' 
   AND indexname = 'opening_signals_listing_hash_idx';
   
   -- Should show unique index on listing_hash
   ```

4. **Re-run the Edge Function:**
   ```bash
   curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

## Why This Happens

- The original table schema had a unique constraint on `apply_url`
- We changed to use `listing_hash` as the unique key (which includes company_name, role_title, location, term, and apply_url)
- The old constraint wasn't removed, causing conflicts when multiple roles from the same company share the same apply_url

## After Fix

- Multiple roles can share the same `apply_url` (e.g., different roles at the same company)
- Upserts use `listing_hash` which is unique per (company, role, location, term, apply_url) combination
- No more duplicate key errors

