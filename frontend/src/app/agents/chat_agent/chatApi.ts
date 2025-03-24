import { Client, ThreadState } from "@langchain/langgraph-sdk";
import { LangChainMessage } from "@assistant-ui/react-langgraph";

const createClient = (accessToken?: string) => {
  const apiUrl = process.env["NEXT_PUBLIC_LANGGRAPH_API_URL"] || "/api";
  return new Client({
    apiUrl,
    defaultHeaders: {
      Authorization: `Bearer ${accessToken || process.env["NEXT_PUBLIC_LANGGRAPH_API_KEY"]}`,
    },
  });
};

export const createThread = async (accessToken?: string) => {
  const client = createClient(accessToken);
  return client.threads.create();
};

export const getThreadState = async (
  threadId: string,
  accessToken?: string
): Promise<ThreadState<{ messages: LangChainMessage[] }>> => {
  const client = createClient(accessToken);
  return client.threads.getState(threadId);
};

export const sendMessage = async (params: {
  threadId: string;
  messages: LangChainMessage;
  accessToken?: string;
}) => {
  const client = createClient(params.accessToken);
  return client.runs.stream(params.threadId, "chat_graph", {
    input: {
      messages: params.messages,
    },
    streamMode: "messages",
  });
};
