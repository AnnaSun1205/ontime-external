# refresh_opening_signals Edge Function

This Edge Function fetches internship data from SimplifyJobs GitHub repository and upserts it into the `opening_signals` table with robust error handling, security, and monitoring.

## Features

- ✅ **Robust Parsing**: Handles HTML table variations, column order changes, and malformed rows
- ✅ **Structured Data Support**: Attempts to use JSON/CSV/YAML if available, falls back to HTML
- ✅ **Error Handling**: Skips malformed rows, logs errors, returns detailed debug info
- ✅ **Security**: Uses service role key only in Edge Function (never in frontend)
- ✅ **RLS Policies**: Frontend has SELECT-only access
- ✅ **Stale Detection**: Automatically marks listings inactive after 7 days
- ✅ **Detailed Logging**: Returns debug information for monitoring

## Quick Start

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for complete setup instructions.

## Documentation

- **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** - Complete production setup guide
- **[TESTING.md](./TESTING.md)** - Testing instructions and examples
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** - Security checklist and verification

## Response Format

**Success with Debug Info:**
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
    "source_fetch": { "status": "failed", "error": "..." },
    "parsing": { "errors": ["..."], "skipped": 0 },
    "upsert": { "errors": ["..."] },
    "duration_ms": 567
  }
}
```

## Quick Test

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

See [TESTING.md](./TESTING.md) for more testing options.

