import { Client } from "@langchain/langgraph-sdk";
import { createClient } from "@/utils/supabase/client";

export async function createLangGraphClient(
  apiUrl: string,
  apiKey: string | undefined
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const session = supabase.auth.session ? supabase.auth.session() : null;
  const accessToken = session?.access_token;
  
  if (!accessToken) {
    throw new Error("No access token found. User might not be authenticated.");
  }

  return new Client({
    apiKey,
    apiUrl,
    defaultHeaders: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
