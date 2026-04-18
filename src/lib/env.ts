export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_BUCKET ?? "food-images"
};

export const assertEnv = (): void => {
  if (!env.supabaseUrl) {
    throw new Error("Missing env var: SUPABASE_URL");
  }
  if (!env.supabaseServiceRoleKey) {
    throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");
  }
};
