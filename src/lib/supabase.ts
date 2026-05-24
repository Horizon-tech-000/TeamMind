import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://viaaczcxqempdidotbex.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYWFjemN4cWVtcGRpZG90YmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzIwMDksImV4cCI6MjA5NTIwODAwOX0.i10I01yAhcae3BJKC4y2iuz-eXlPx87lOPfdxcI95xU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
