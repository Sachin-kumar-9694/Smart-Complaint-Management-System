// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bcevqhhunwukjjibinjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZXZxaGh1bnd1a2pqaWJpbmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODMwNDQsImV4cCI6MjA2NjM1OTA0NH0.K30YM8M3vb6FHzD_jKrrhW5NDCVxBNHJYINlwMtbNmw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);