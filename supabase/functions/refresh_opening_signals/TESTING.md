# Testing Guide for refresh_opening_signals Edge Function

## 1. Check Extension Support

First, verify if pg_cron and pg_net are available in your Supabase project:

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/check_extensions.sql
```

This will show:
- Whether extensions are installed
- Whether you have superuser privileges (required for pg_cron)
- Recommended approach based on your setup

## 2. Local Testing (Deno)

### Prerequisites

```bash
# Install Deno if not already installed
curl -fsSL https://deno.land/install.sh | sh

# Or using Homebrew (macOS)
brew install deno
```

### Test the Function Locally

```bash
# Navigate to the function directory
cd supabase/functions/refresh_opening_signals

# Set environment variables
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

# Run the function locally
deno run --allow-net --allow-env index.ts
```

### Test with a Local Server

```bash
# Start a local server
deno run --allow-net --allow-env --watch index.ts

# In another terminal, test with curl
curl -X POST http://localhost:8000 \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 3. Test Deployed Function

### Using cURL

```bash
# Replace with your actual values
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

curl -X POST "${SUPABASE_URL}/functions/v1/refresh_opening_signals" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v | jq .
```

### Using Supabase Dashboard

1. Go to **Edge Functions** > `refresh_opening_signals`
2. Click **Invoke**
3. Check the response in the logs

### Expected Response Format

**Success:**
```json
{
  "ok": true,
  "inserted": 10,
  "updated": 5,
  "total": 15,
  "debug": {
    "source_fetch": {
      "status": "success",
      "url": "https://raw.githubusercontent.com/...",
      "size_bytes": 123456
    },
    "parsing": {
      "method": "html",
      "tables_found": 2,
      "active_tables": 1,
      "inactive_tables": 1,
      "rows_parsed": 15,
      "errors": [],
      "skipped": 0
    },
    "upsert": {
      "inserted": 10,
      "updated": 5,
      "total": 15,
      "errors": []
    },
    "duration_ms": 1234
  }
}
```

**Error:**
```json
{
  "ok": false,
  "error": "Error message",
  "inserted": 0,
  "updated": 0,
  "debug": {
    "source_fetch": {
      "status": "failed",
      "error": "Failed to fetch: 404 Not Found"
    },
    "parsing": {
      "method": "html",
      "tables_found": 0,
      "rows_parsed": 0,
      "errors": ["Table 0: No tbody found"],
      "skipped": 0
    },
    "upsert": {
      "inserted": 0,
      "updated": 0,
      "total": 0,
      "errors": []
    },
    "duration_ms": 567
  }
}
```

## 4. Verify Database Changes

After running the function, verify the data:

```sql
-- Check recent inserts/updates
SELECT 
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE first_seen_at >= now() - interval '1 hour') as recent_inserts,
  COUNT(*) FILTER (WHERE last_seen_at >= now() - interval '1 hour') as recent_updates,
  COUNT(*) FILTER (WHERE is_active = true) as active_listings,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_listings
FROM opening_signals;

-- Check for duplicate listing_hashes (should be 0)
SELECT listing_hash, COUNT(*) 
FROM opening_signals 
GROUP BY listing_hash 
HAVING COUNT(*) > 1;

-- Check recent activity
SELECT 
  company_name,
  role_title,
  last_seen_at,
  is_active,
  first_seen_at
FROM opening_signals
ORDER BY last_seen_at DESC
LIMIT 10;
```

## 5. Test Error Scenarios

### Test with Invalid URL

```bash
# Temporarily modify GITHUB_URL in index.ts to an invalid URL
# Then test to see error handling
```

### Test with Malformed HTML

The function should skip malformed rows and log errors in the `debug.parsing.errors` array.

### Test with Missing Environment Variables

```bash
# Unset environment variables
unset SUPABASE_URL
unset SUPABASE_SERVICE_ROLE_KEY

# Run function - should return error
```

## 6. Performance Testing

```bash
# Time the function execution
time curl -X POST "${SUPABASE_URL}/functions/v1/refresh_opening_signals" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Check the `debug.duration_ms` field in the response for execution time.

## 7. Load Testing

```bash
# Run multiple requests in parallel (be careful not to overload)
for i in {1..5}; do
  curl -X POST "${SUPABASE_URL}/functions/v1/refresh_opening_signals" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}' &
done
wait
```

## 8. Monitor Logs

Check Supabase Dashboard > Edge Functions > `refresh_opening_signals` > Logs for:
- Execution times
- Error messages
- Console.log outputs

## Troubleshooting

### Function returns 500 error
- Check Edge Function logs in Supabase Dashboard
- Verify environment variables are set correctly
- Check that `listing_hash` column exists in `opening_signals` table

### No data inserted/updated
- Check `debug.parsing.rows_parsed` - if 0, parsing failed
- Check `debug.parsing.errors` for parsing issues
- Verify GitHub URL is accessible

### Duplicate key errors
- Check that `listing_hash` unique index exists
- Verify hash computation is consistent

