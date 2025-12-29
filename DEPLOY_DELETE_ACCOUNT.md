# Deploy Delete Account Feature

## ✅ Frontend Changes Committed & Pushed

The frontend changes have been committed and pushed to `main`:
- `src/pages/app/SettingsTab.tsx` - Updated with proper Edge Function invocation
- Console logs added for debugging
- Error handling and UI feedback implemented

**Commit:** `2186907` - "Implement Delete Account functionality with Edge Function integration"

The production frontend should automatically rebuild from `main` after this push.

## 📦 Deploy Edge Function

Since Supabase CLI is not available, deploy manually via Supabase Dashboard:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click **Create a new function** (or find `delete_account` if it exists)
5. Name it: `delete_account`
6. Copy the contents of `supabase/functions/delete_account/index.ts`
7. Paste into the editor
8. Click **Deploy**

### Option 2: Supabase CLI (if you install it)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy
supabase functions deploy delete_account
```

## 🔧 Set Environment Variables

After deploying, set these environment variables in Supabase Dashboard:

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following:
   - `SUPABASE_URL`: Your project URL (e.g., `https://YOUR_PROJECT.supabase.co`)
   - `SUPABASE_ANON_KEY`: Your anonymous key (found in **Project Settings** → **API**)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (found in **Project Settings** → **API**)

## ✅ Verification Steps

After deployment, test the flow:

1. **Browser Console:**
   - Click "Delete Account" button
   - Should see: `delete clicked`
   - Should see: `session exists? true` (if logged in)
   - Should see: `invoke result { data: {...}, error: null }` (on success)

2. **Supabase Dashboard:**
   - Go to **Edge Functions** → `delete_account`
   - Click **Invocations** tab
   - Should show a new invocation when you click Delete Account
   - Click **Logs** tab
   - Should see: `delete_account invoked` at the start
   - Should see: `Starting account deletion for user: <user_id>`
   - Should see all deletion steps completing

3. **UI Flow:**
   - Click "Delete Account" → Confirmation modal appears
   - Click "Delete" → Button shows "Deleting..." (loading state)
   - Success toast appears: "Your account has been deleted successfully"
   - User is logged out and redirected to landing page

## 🐛 Troubleshooting

If the function is not being invoked:

1. **Check browser console** for errors
2. **Verify Edge Function is deployed** in Supabase Dashboard
3. **Check environment variables** are set correctly
4. **Verify user is authenticated** (session exists)
5. **Check Edge Function logs** for any errors

If you see errors in logs:

- `Missing authorization header` → Frontend not sending JWT (check `supabase.functions.invoke()`)
- `Invalid or expired token` → User session expired (user needs to re-login)
- `Server configuration error` → Environment variables not set correctly
- Database errors → Check foreign key constraints and table permissions

## 📝 Files Changed

- `src/pages/app/SettingsTab.tsx` - Frontend delete account handler
- `supabase/functions/delete_account/index.ts` - Edge Function for account deletion

Both files are now in the `main` branch and ready for deployment.

