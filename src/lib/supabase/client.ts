import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !key) throw new Error("Supabase URL or ANON_KEY missing.");
  const url = rawUrl.replace(/\/$/, "");
  return createSupabaseClient(url, key);
}
