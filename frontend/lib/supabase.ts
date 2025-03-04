import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_API_URL) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_API_URL");
}
if (!process.env.SUPABASE_ANON_KEY) {
    throw new Error("Missing env.SUPABASE_ANON_KEY");
}

export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_API_URL,
    process.env.SUPABASE_ANON_KEY
);
