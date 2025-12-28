# Fix Company Name Parsing - Deployment Guide

## Problem
Some rows in the database use "↳" symbol instead of a company name, causing the same company to appear as separate entries. This happens when SimplifyJobs uses "↳" to indicate a row belongs to the previous company.

## Solution
Updated the Edge Function parser to:
1. Track the current company name across rows
2. If a row has "↳" or empty company name, use the previous company name
3. If a row has a real company name, update the tracked company name

## Deployment Steps

### 1. Clean Up Existing Bad Rows

Run the cleanup script to remove existing bad data:

```bash
node scripts/cleanup_bad_company_names.js
```

This will:
- Find all rows where `company_name` is "↳", empty, or null
- Delete those rows
- Show a summary of deleted rows

### 2. Deploy Updated Edge Function

Deploy the updated Edge Function with the fixed parser:

```bash
# Using Supabase CLI
supabase functions deploy refresh_opening_signals

# Or use Supabase Dashboard > Edge Functions > refresh_opening_signals > Deploy
```

### 3. Re-run Ingestion

Trigger the Edge Function to re-populate data with correct company names:

```bash
# Using cURL
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Or use Supabase Dashboard > Edge Functions > refresh_opening_signals > Invoke

### 4. Verify Results

Check that company names are correct:

```sql
-- Check for any remaining bad company names
SELECT COUNT(*) 
FROM opening_signals 
WHERE company_name = '↳' 
   OR company_name IS NULL 
   OR company_name = '';

-- Should return 0

-- Check that companies are properly grouped
SELECT company_name, COUNT(*) as role_count
FROM opening_signals
WHERE is_active = true
GROUP BY company_name
ORDER BY role_count DESC
LIMIT 10;

-- Each company should appear once with multiple roles
```

## What Changed

### Edge Function (`supabase/functions/refresh_opening_signals/index.ts`)

**Added company name tracking:**
- `currentCompany` variable tracks the most recent valid company name
- When a row has "↳" or empty company name, uses `currentCompany`
- When a row has a real company name, updates `currentCompany`

**Updated parsing logic:**
- Detects "↳" symbol (including variations with whitespace)
- Falls back to previous company name when "↳" is found
- Skips rows only if no previous company name is available

## Testing

After deployment, verify:
1. ✅ No rows with "↳" or empty company names
2. ✅ Companies appear once in the database (even with multiple roles)
3. ✅ UI shows each company as a single entry
4. ✅ All roles are correctly associated with their companies

## Rollback

If issues occur:
1. The cleanup script only deletes bad rows (doesn't affect good data)
2. Re-running ingestion will repopulate data
3. Previous Edge Function version can be redeployed if needed

