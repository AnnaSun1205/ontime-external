-- Create RPC function for atomic lock acquisition
-- This function atomically checks schedule AND acquires lock in a single operation

CREATE OR REPLACE FUNCTION public.acquire_refresh_lock(
  p_function_name text,
  p_request_id text,
  p_lock_until timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_run_at timestamptz;
  v_locked_until timestamptz;
  v_current_time timestamptz := now();
  v_can_acquire boolean := false;
BEGIN
  -- Get current schedule state
  SELECT next_run_at, locked_until
  INTO v_next_run_at, v_locked_until
  FROM public.refresh_schedule
  WHERE function_name = p_function_name;
  
  -- If no schedule exists (first run), create it and acquire lock
  IF v_next_run_at IS NULL THEN
    INSERT INTO public.refresh_schedule (
      function_name,
      next_run_at,
      locked_until,
      locked_by,
      last_status,
      updated_at
    ) VALUES (
      p_function_name,
      v_current_time, -- Allow immediate execution
      p_lock_until,
      p_request_id,
      'pending',
      v_current_time
    )
    ON CONFLICT (function_name) DO NOTHING;
    
    -- Check if insert succeeded (no conflict)
    IF FOUND THEN
      RETURN true;
    END IF;
    
    -- If conflict, re-read the row
    SELECT next_run_at, locked_until
    INTO v_next_run_at, v_locked_until
    FROM public.refresh_schedule
    WHERE function_name = p_function_name;
  END IF;
  
  -- Check if we can acquire lock:
  -- 1. next_run_at is null OR now() >= next_run_at (time to run)
  -- 2. locked_until is null OR locked_until < now() (not locked)
  v_can_acquire := (
    (v_next_run_at IS NULL OR v_current_time >= v_next_run_at) AND
    (v_locked_until IS NULL OR v_locked_until < v_current_time)
  );
  
  -- If we can acquire, update atomically
  IF v_can_acquire THEN
    UPDATE public.refresh_schedule
    SET 
      locked_until = p_lock_until,
      locked_by = p_request_id,
      updated_at = v_current_time
    WHERE function_name = p_function_name
      AND (
        -- Double-check conditions are still true (optimistic locking)
        (next_run_at IS NULL OR v_current_time >= next_run_at) AND
        (locked_until IS NULL OR locked_until < v_current_time)
      );
    
    -- Return true only if update affected a row
    RETURN FOUND;
  END IF;
  
  -- Cannot acquire lock
  RETURN false;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.acquire_refresh_lock IS 'Atomically acquires a lease lock for refresh function execution. Returns true if lock acquired, false otherwise.';

