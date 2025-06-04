import { Client } from "@langchain/langgraph-sdk";
import { useAuth } from "@/contexts/AuthContext";

export const createClient = async ({
  deploymentUrl,
  langchainApiKey,
}: {
  deploymentUrl: string;
  langchainApiKey: string | undefined;
}) => {
  // Get supabase client instance and get access token
  const { supabase } = useAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No user found. User may not be authenticated.");
  }

  const session = supabase.auth.getSession();
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
