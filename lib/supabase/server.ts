import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
export function admin() { const { url, key } = env(); return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
