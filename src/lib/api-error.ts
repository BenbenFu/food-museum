export const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const withHint = (message: string): string => {
  if (
    message.includes("SUPABASE_URL") ||
    message.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    message.includes("Missing env var")
  ) {
    return "Server config missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.";
  }
  if (message.includes("relation") && message.includes("food_entries")) {
    return "Database table missing. Please run supabase/schema.sql in your Supabase project.";
  }
  if (message.includes("bucket") || message.includes("storage")) {
    return "Storage bucket issue. Please create public bucket 'food-images' (or update SUPABASE_BUCKET).";
  }
  return message;
};
