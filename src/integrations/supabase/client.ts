import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://iifhuvgifbtpahwzueml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZmh1dmdpZmJ0cGFod3p1ZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NTc3MTEsImV4cCI6MjA1MTMzMzcxMX0.0Aj9qmbX5xivgnLeHZYY1AY0SQ8Gm5giIMd5CzRlYnM";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);