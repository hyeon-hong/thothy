import { Client } from "@langchain/langgraph-sdk";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useCallback } from "react";

// Custom hook for LangGraph API interactions within components
export function useLangGraphApi() {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  
  const createClient = useCallback(() => {
    return new Client({
      apiUrl,
      apiKey: accessToken || process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY,
      defaultHeaders: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
  }, [accessToken, apiUrl]);

  const createThread = useCallback(async (assistantId: string) => {
    try {
      const client = createClient();
      const thread = await client.threads.create();
      return { thread_id: thread.thread_id };
    } catch (error) {
      console.error("Error creating thread:", error);
      throw error;
    }
  }, [createClient]);

  const getThreadState = useCallback(async (threadId: string, assistantId: string) => {
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
  }, [createClient]);

  const sendMessage = useCallback(async ({
    threadId,
    messages,
    assistantId,
  }: {
    threadId: string;
    messages: any[];
    assistantId: string;
  }) => {
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
  }, [createClient]);

  return {
    createThread,
    getThreadState,
    sendMessage,
  };
} 