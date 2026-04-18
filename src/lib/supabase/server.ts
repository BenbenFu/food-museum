import { createClient } from "@supabase/supabase-js";
import { assertEnv, env } from "@/lib/env";

export const getSupabaseServer = () => {
  assertEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
