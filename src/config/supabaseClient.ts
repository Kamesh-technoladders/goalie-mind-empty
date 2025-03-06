
import { createClient } from "@supabase/supabase-js";
import type { Database } from './type';

// Hardcoded values for development - in production these would come from env vars
const supabaseUrl = "https://kbpeyfietrwlhwcwqhjw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticGV5ZmlldHJ3bGh3Y3dxaGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NDA5NjEsImV4cCI6MjA1NDQxNjk2MX0.A-K4DO6D2qQZ66qIXY4BlmoHxc-W5B0itV-HAAM84YA";

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export default supabase;
