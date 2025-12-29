# JWT Validation Fix for Delete Account

## Problem
Edge Function was receiving a token without a `sub` claim, causing "invalid claim: missing sub claim" error. This indicates the token was not a user access token (possibly anon key or service role key).

## Fixes Applied

### 1. Edge Function Token Validation
Added comprehensive logging and validation:

- **Authorization header check**: `console.log('hasAuth?', !!authHeader)`
- **JWT format check**: `console.log('looksJwt?', token?.split('.').length === 3)`
- **Sub claim verification**: Decodes JWT payload and checks for `sub` claim before calling `getUser()`
- **Early error return**: If token doesn't have `sub`, returns clear error message

### 2. Frontend Session Verification
Added logging to verify session token:

- **Session check**: `console.log('session exists?', !!sessionData.session)`
- **Access token check**: `console.log('access_token exists?', !!sessionData.session?.access_token)`
- **JWT format check**: `console.log('access_token looks JWT?', sessionData.session?.access_token?.split('.').length === 3)`
- **Explicit validation**: Returns error if access_token is missing

## Expected Logs

### Browser Console (Frontend)
When clicking "Delete Account":
```
delete clicked
session exists? true
access_token exists? true
access_token looks JWT? true
invoke result { data: {...}, error: null }
```

### Edge Function Logs (Supabase Dashboard)
```
delete_account invoked
hasAuth? true
looksJwt? true tokenLength: <number>
JWT payload has sub? true sub value: <user_id>
Starting account deletion for user: <user_id>
✓ Events deleted
✓ Board companies deleted
✓ Boards deleted
✓ User preferences deleted
✓ Profiles deleted
✓ User settings deleted
✓ User deleted from Auth
Account deletion completed successfully for user: <user_id>
```

## Important: Supabase Function Settings

**Disable "Verify JWT with legacy secret"** in Supabase Dashboard:

1. Go to **Edge Functions** → `delete_account`
2. Click **Settings** or **Configuration**
3. Find **"Verify JWT with legacy secret"** option
4. **Turn it OFF** (unchecked)
5. Save changes

We handle JWT verification in-code using `supabase.auth.getUser(token)`, so the legacy secret verification is not needed and may cause conflicts.

## Troubleshooting

### If logs show `hasAuth? false`:
- Frontend is not sending Authorization header
- Check that `supabase.functions.invoke()` is being called correctly
- Verify user is logged in

### If logs show `looksJwt? false`:
- Token format is incorrect
- May be receiving anon key or service role key instead of user token
- Check frontend is using `supabase.functions.invoke()` (not manual fetch with wrong token)

### If logs show `JWT payload has sub? false`:
- Token is not a user access token
- May be anon key, service role key, or malformed token
- Verify `supabase.functions.invoke()` is using the current user's session

### If "Verify JWT with legacy secret" is enabled:
- This may interfere with our in-code JWT verification
- Disable it in Supabase Dashboard → Edge Functions → delete_account → Settings

## Files Changed

- `supabase/functions/delete_account/index.ts` - Added JWT validation and logging
- `src/pages/app/SettingsTab.tsx` - Added session token verification logging

Both files committed and pushed to `main`.

