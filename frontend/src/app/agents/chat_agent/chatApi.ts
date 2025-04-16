import { Client, ThreadState } from "@langchain/langgraph-sdk";
import { LangChainMessage } from "@assistant-ui/react-langgraph";

export class LangGraphClient {
  private static instance: Client | null = null;
  private static currentAccessToken: string | undefined;

  private static getInstance(): Client {
    const apiUrl = process.env["NEXT_PUBLIC_LANGGRAPH_API_URL"] || "/api";
    
    // Create new instance if none exists
    if (!this.instance) {
      this.instance = new Client({
        apiUrl,
        defaultHeaders: {
          Authorization: `Bearer ${this.currentAccessToken || ""}`,
        },
      });
    }
    
    return this.instance;
  }

  static updateAccessToken(accessToken?: string) {
    // Force creation of new instance with new token
    this.currentAccessToken = accessToken;
    this.instance = null;
    return this.getInstance();
  }

  static getClient(): Client {
    return this.getInstance();
  }
}

export const createThread = async () => {
  const client = LangGraphClient.getClient();
  return client.threads.create();
};

export const getThreadState = async (
  threadId: string
): Promise<ThreadState<{ messages: LangChainMessage[] }>> => {
  const client = LangGraphClient.getClient();
  return client.threads.getState(threadId);
};

export const sendMessage = async (params: {
  threadId: string;
  messages: LangChainMessage;
}) => {
  const client = LangGraphClient.getClient();
  return client.runs.stream(params.threadId, "chat_graph", {
    input: {
      messages: params.messages,
      // TODO: Set each id
      configurable: {
        project_id: "default",
        team_id: "default",
        staff_id: "default",
        agent_id: "chat",
        user_id: "default",
        graph_name: "chat_graph",
      },
    },
    streamMode: "messages",
  });
};
