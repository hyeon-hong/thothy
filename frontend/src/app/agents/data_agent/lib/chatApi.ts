import { ThreadState, Client } from "@langchain/langgraph-sdk";
import { LangChainMessage } from "@assistant-ui/react-langgraph";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

const createClient = async () => {
  // TODO: We don't run the typescript agent in LangGraph Platform, so we need to use the develop api url
  const apiUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEVELOP_LANGGRAPH_API_URL
      : process.env.NEXT_PUBLIC_DEVELOP_LANGGRAPH_API_URL;

  const supabase = createSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  console.log("supabase: ", supabase);
  console.log("error: ", error);
  console.log("session: ", session);

  const apiKey =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEVELOP_LANGSMITH_API_KEY
      : process.env.NEXT_PUBLIC_MAIN_LANGSMITH_API_KEY;

  return new Client({
    apiUrl,
    apiKey: apiKey,
    defaultHeaders: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  });
};

export const createAssistant = async (graphId: string) => {
  const client = await createClient();
  return client.assistants.create({ graphId });
};

export const createThread = async () => {
  const client = await createClient();
  return client.threads.create();
};

export const getThreadState = async (
  threadId: string
): Promise<ThreadState<Record<string, any>>> => {
  const client = await createClient();
  return client.threads.getState(threadId);
};

export const updateState = async (
  threadId: string,
  fields: {
    newState: Record<string, any>;
    asNode?: string;
  }
) => {
  const client = await createClient();
  return client.threads.updateState(threadId, {
    values: fields.newState,
    asNode: fields.asNode!,
  });
};

export const sendMessage = async (params: {
  threadId: string;
  messages: LangChainMessage[];
}) => {
  const client = await createClient();

  const input: Record<string, any> | null = {
    messages: params.messages,
  };
  const config = {
    configurable: {
      model_name: "openai",
    },
  };

  return client.runs.stream(
    params.threadId,
    process.env["NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID"]!,
    {
      input,
      config,
      streamMode: "messages",
    }
  );
};
