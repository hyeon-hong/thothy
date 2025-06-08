import { Client } from "@langchain/langgraph-sdk";

export const createClient = async ({
  deploymentUrl,
  langchainApiKey,
  supabase,
}: {
  deploymentUrl: string;
  langchainApiKey: string | undefined;
  supabase: any;
}) => {
  // Get access token from supabase client
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No user found. User may not be authenticated.");
  }

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
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
