import { Client } from "@langchain/langgraph-sdk";
import { createClient } from "@/utils/supabase/client";

export async function createLangGraphClient(
  apiUrl: string,
  apiKey: string | undefined
) {
  console.log("Creating LangGraph client with API URL:", apiUrl);
  console.log("API Key:", apiKey);

  const supabase = createClient();
  console.log("supabase", supabase);
  const { data } = await supabase.auth.getSession();
  console.log("data", data);

  const accessToken = data.session?.access_token;
  console.log("accessToken", accessToken);
  
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
