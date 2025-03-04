
import { createClient } from "@supabase/supabase-js";
import type { Database } from './type';

// Use hardcoded values if environment variables aren't available
const supabaseUrl = "https://rjofefcmhtvrlhfwzvgr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb2ZlZmNtaHR2cmxoZnd6dmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMzY5OTUsImV4cCI6MjA1NDkxMjk5NX0.awgF0Hc8kGIOvTmA03t_dwir87vF3Fnkq5l5G_d6Zjg";

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export default supabase;
