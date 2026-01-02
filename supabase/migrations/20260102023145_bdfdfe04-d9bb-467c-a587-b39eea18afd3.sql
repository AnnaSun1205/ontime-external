-- Enable Row Level Security on system execution log table
-- This prevents anonymous/authenticated clients from reading operational logs.
-- Note: service role and SECURITY DEFINER functions will still be able to write.
ALTER TABLE public.refresh_execution_log ENABLE ROW LEVEL SECURITY;