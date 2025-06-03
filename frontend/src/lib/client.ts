import { Client } from "@langchain/langgraph-sdk";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

export const createClient = async ({
  deploymentUrl,
  langchainApiKey,
}: {
  deploymentUrl: string;
  langchainApiKey: string | undefined;
}) => {
  // Get supabase client instance and get access token
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  console.log("[createClient] accessToken:", accessToken);
  if (!accessToken) {
    throw new Error("No access token found. User may not be authenticated.");
  }
  return new Client({
    apiUrl: deploymentUrl,
    apiKey: langchainApiKey,
    defaultHeaders: {
      Authorization: `Bearer ${accessToken}`,
      // ...(langchainApiKey && { "x-api-key": langchainApiKey }),
    },
  });
};
