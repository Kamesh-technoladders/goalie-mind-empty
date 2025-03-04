
import { createClient } from "@supabase/supabase-js";
import type { Database } from './type';

const supabaseUrl = "https://your-supabase-url.supabase.co"; // Replace with your actual Supabase URL
const supabaseAnonKey = "your-supabase-anon-key"; // Replace with your actual Supabase anon key

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export default supabase;
