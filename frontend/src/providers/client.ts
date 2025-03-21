import { Client } from "@langchain/langgraph-sdk";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

export async function createClient(apiUrl: string, apiKey: string | undefined) {
  const supabase = createSupabaseClient();
  console.log("supabase: ", supabase);
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  console.log("accessToken: ", accessToken);

  return new Client({
    apiKey,
    apiUrl,
    defaultHeaders: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
