import { Client } from "@langchain/langgraph-sdk";
import { useAuth } from "@/contexts/AuthContext";

// The URL should be provided via environment variables
const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;

// Create LangGraph client with access token from AuthContext
const createClient = () => {
  let accessToken = null;
  // Check if we're in a browser environment where useAuth can be called
  if (typeof window !== 'undefined') {
    try {
      // This is a workaround since hooks can't be called outside components
      // In a real implementation, you should pass the session token down from components
      const authState = localStorage.getItem('thothy_auth_state');
      if (authState) {
        const { session } = JSON.parse(authState);
        accessToken = session?.access_token;
      }
    } catch (error) {
      console.error("Error getting auth state:", error);
    }
  }
  console.log("[langgraph-api] accessToken:", accessToken);
  if (!accessToken) {
    throw new Error("No access token found. User may not be authenticated.");
  }
  return new Client({
    apiUrl,
    apiKey: accessToken || process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY,
    defaultHeaders: {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });
};

export async function createThread(assistantId: string) {
  try {
    const client = createClient();
    const thread = await client.threads.create();
    return { thread_id: thread.thread_id };
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error;
  }
}

export async function getThreadState(threadId: string, assistantId: string) {
  try {
    const client = createClient();
    const state = await client.threads.getState(threadId);

    return {
      values: {
        messages: state.values?.messages || [],
      },
      tasks: state.tasks || [],
    };
  } catch (error) {
    console.error("Error getting thread state:", error);
    throw error;
  }
}

export async function sendMessage({
  threadId,
  messages,
  assistantId,
}: {
  threadId: string;
  messages: any[];
  assistantId: string;
}) {
  try {
    const client = createClient();
    const stream = await client.runs.stream(threadId, assistantId, {
      input: {
        messages,
      },
      streamMode: "updates",
    });

    return stream;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
