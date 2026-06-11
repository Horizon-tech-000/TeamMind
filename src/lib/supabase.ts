import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key is safe to expose in client code.
const FALLBACK_SUPABASE_URL = "https://viaaczcxqempdidotbex.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYWFjemN4cWVtcGRpZG90YmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzIwMDksImV4cCI6MjA5NTIwODAwOX0.i10I01yAhcae3BJKC4y2iuz-eXlPx87lOPfdxcI95xU";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || FALLBACK_SUPABASE_PUBLISHABLE_KEY;

// Always true now — preview falls back to hardcoded publishable credentials.
export const hasSupabaseEnvConfig = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
export const supabaseEnvErrorMessage = hasSupabaseEnvConfig
  ? null
  : "Missing required Supabase configuration.";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
