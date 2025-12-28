# Deploy Edge Function and Reset Data

## Step 1: Confirm Code is Committed ✅

The updated `index.ts` with `currentCompany` logic is committed to GitHub main (commit `f2ffbb8`).

## Step 2: Deploy Edge Function to Supabase

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Find `refresh_opening_signals` function
5. Click **Edit** or **Deploy**
6. Copy the contents of `supabase/functions/refresh_opening_signals/index.ts`
7. Paste into the editor
8. Click **Deploy** or **Save**

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
cd /Users/anna/Desktop/ontime-external
supabase functions deploy refresh_opening_signals
```

## Step 3: Reset Data and Re-run

After deployment, run these commands:

```bash
# Navigate to project directory
cd /Users/anna/Desktop/ontime-external

# Run the reset and verify script
node scripts/reset_and_verify.js
```

Or manually:

1. **Truncate opening_signals** (run in Supabase SQL Editor):
   ```sql
   TRUNCATE TABLE opening_signals;
   ```

2. **Re-run Edge Function** (via Dashboard or cURL):
   ```bash
   curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/refresh_opening_signals" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

3. **Verify no bad rows**:
   ```sql
   SELECT COUNT(*) 
   FROM opening_signals 
   WHERE company_name = '↳' 
      OR company_name IS NULL 
      OR company_name = '';
   -- Should return 0
   ```

## Step 4: Verify Results

```sql
-- Check for bad company names (should be 0)
SELECT COUNT(*) as bad_rows
FROM opening_signals 
WHERE company_name = '↳' 
   OR company_name IS NULL 
   OR company_name = '';

-- Check that companies are properly grouped
SELECT company_name, COUNT(*) as role_count
FROM opening_signals
WHERE is_active = true
GROUP BY company_name
HAVING COUNT(*) > 1
ORDER BY role_count DESC
LIMIT 10;

-- Each company should appear once with multiple roles
```

