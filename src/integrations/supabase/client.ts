import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mmrbryazxgrekyvjwule.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcmJyeWF6eGdyZWt5dmp3dWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NTU3NjMsImV4cCI6MjA4MjEzMTc2M30.9l15dgqrH_dVhTAKSryWLZ3vhDEmhfBFULOQCB2lXGo";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
