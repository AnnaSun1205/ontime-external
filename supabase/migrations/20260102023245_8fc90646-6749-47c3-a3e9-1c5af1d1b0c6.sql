-- Enable Row Level Security on remaining system tables
-- These are internal audit/scheduling tables that should not be publicly accessible.
-- With RLS enabled and no policies, only service role and SECURITY DEFINER functions can access.

-- Enable RLS on refresh_run_audit table
ALTER TABLE public.refresh_run_audit ENABLE ROW LEVEL SECURITY;

-- Enable RLS on refresh_schedule table  
ALTER TABLE public.refresh_schedule ENABLE ROW LEVEL SECURITY;