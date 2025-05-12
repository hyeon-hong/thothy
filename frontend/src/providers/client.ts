import { Client } from "@langchain/langgraph-sdk";
import { createClient } from "@/utils/supabase/client";

export async function createLangGraphClient(
  apiUrl: string,
  apiKey: string | undefined
) {
  const supabase = createClient();
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
