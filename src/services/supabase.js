import { createClient } from "@supabase/supabase-js";

export function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ""
  };
}

export function ensureSupabaseConfig() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    console.warn("Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

export function createSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error("Supabase env vars missing. Check .env file.");
  }
  return createClient(url, anonKey);
}
