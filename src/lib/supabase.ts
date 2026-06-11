import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key is safe to expose in client code.
const FALLBACK_SUPABASE_URL = "https://viaaczcxqempdidotbex.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYWFjemN4cWVtcGRpZG90YmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzIwMDksImV4cCI6MjA5NTIwODAwOX0.i10I01yAhcae3BJKC4y2iuz-eXlPx87lOPfdxcI95xU";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

const missingSupabaseEnvVars = [
  !SUPABASE_URL ? "VITE_SUPABASE_URL" : null,
  !SUPABASE_PUBLISHABLE_KEY ? "VITE_SUPABASE_PUBLISHABLE_KEY" : null,
].filter((name): name is string => Boolean(name));

export const hasSupabaseEnvConfig = missingSupabaseEnvVars.length === 0;
export const supabaseEnvErrorMessage = hasSupabaseEnvConfig
  ? null
  : `Missing required Supabase environment variables: ${missingSupabaseEnvVars.join(", ")}.`;

const supabaseUrlToUse = hasSupabaseEnvConfig ? SUPABASE_URL : FALLBACK_SUPABASE_URL;
const supabaseKeyToUse = hasSupabaseEnvConfig
  ? SUPABASE_PUBLISHABLE_KEY
  : FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrlToUse, supabaseKeyToUse, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
