import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceKey) throw new Error("Supabase URL or SERVICE_ROLE_KEY missing.");
  const url = rawUrl.replace(/\/$/, "");
  return createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
