# Security Audit Checklist

## ✅ Service Role Key Security

- [x] Service role key is ONLY stored in Edge Function environment variables (Supabase Dashboard secrets)
- [x] Service role key is NOT in frontend code
- [x] Service role key is NOT in git repository
- [x] Service role key is NOT in migration files
- [x] Service role key is NOT logged in console output

**Verification:**
```bash
# Check git for any service role keys (should return nothing)
grep -r "service.*role.*key" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "eyJ.*" . --exclude-dir=node_modules --exclude-dir=.git | grep -v "example\|placeholder"

# Check frontend code (should only have anon key)
grep -r "SUPABASE.*KEY" src/ --exclude-dir=node_modules
```

## ✅ RLS Policies

- [x] RLS is enabled on `opening_signals` table
- [x] Frontend (anon key) has SELECT-only access
- [x] Service role key bypasses RLS (by design) for Edge Function
- [x] No INSERT/UPDATE/DELETE policies for anon key

**Verification SQL:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'opening_signals';

-- Should return: rowsecurity = true

-- Check policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'opening_signals';

-- Should show:
-- 1. "Allow public SELECT on opening_signals" - FOR SELECT TO public
-- 2. "Allow service role full access" - FOR ALL TO service_role
```

## ✅ Frontend Security

- [x] Frontend uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only
- [x] Frontend does NOT have service role key
- [x] Frontend can only SELECT from `opening_signals`
- [x] Frontend cannot INSERT/UPDATE/DELETE

**Verification:**
```typescript
// Check src/lib/supabaseClient.ts or src/integrations/supabase/client.ts
// Should only use:
// - import.meta.env.VITE_SUPABASE_URL
// - import.meta.env.VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)
// Should NOT use SUPABASE_SERVICE_ROLE_KEY
```

## ✅ Edge Function Security

- [x] Edge Function uses service role key from environment variables only
- [x] Edge Function validates environment variables before use
- [x] Edge Function returns errors without exposing secrets
- [x] Edge Function logs do not include sensitive data

**Verification:**
```typescript
// Check supabase/functions/refresh_opening_signals/index.ts
// Should:
// 1. Get keys from Deno.env.get() only
// 2. Validate keys exist before use
// 3. Not log keys in console.log
// 4. Not return keys in error responses
```

## ✅ Database Security

- [x] `listing_hash` unique constraint prevents duplicates
- [x] `first_seen_at` is preserved on updates (via trigger)
- [x] `is_active` is automatically updated (via trigger)
- [x] No SQL injection vulnerabilities (using parameterized queries via Supabase client)

## ✅ Network Security

- [x] Edge Function validates GitHub URL before fetching
- [x] Edge Function uses HTTPS for all external requests
- [x] Edge Function includes User-Agent header
- [x] Edge Function handles network errors gracefully

## ✅ Error Handling

- [x] Errors are logged but don't expose sensitive data
- [x] Error responses include debug info (without secrets)
- [x] Malformed data is skipped (not inserted)
- [x] Parse errors are tracked and reported

## ✅ Data Integrity

- [x] `listing_hash` ensures no duplicates
- [x] `last_seen_at` is updated on every refresh
- [x] `first_seen_at` is preserved for existing rows
- [x] `is_active` reflects data freshness (7-day window)

## ⚠️ Recommendations

1. **Regular Security Audits**: Review this checklist monthly
2. **Monitor Access Logs**: Check Supabase Dashboard > Logs regularly
3. **Rotate Keys**: Rotate service role key if compromised (rare, but good practice)
4. **Rate Limiting**: Consider adding rate limiting to Edge Function if needed
5. **Backup Strategy**: Ensure Supabase automatic backups are enabled

## 🔒 Production Checklist

Before going to production:

- [ ] All security checks above pass
- [ ] RLS policies are tested with anon key
- [ ] Edge Function is tested and working
- [ ] Cron job is scheduled and verified
- [ ] Monitoring is set up
- [ ] Error alerts are configured (if available)
- [ ] Backup strategy is confirmed
- [ ] Rollback plan is documented

