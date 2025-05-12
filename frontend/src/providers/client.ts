import { Client } from "@langchain/langgraph-sdk";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

export async function createClient(apiUrl: string, apiKey: string | undefined) {
  const supabase = createSupabaseClient();
  const { data } = await supabase.auth.getSession();

  return new Client({
    apiKey,
    apiUrl,
    defaultHeaders: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token}`,
    },
  });
}
