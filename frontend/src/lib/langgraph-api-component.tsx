import { Client } from "@langchain/langgraph-sdk";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useCallback } from "react";

// Custom hook for LangGraph API interactions within components
export function useLangGraphApi() {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  
  console.log("[useLangGraphApi] accessToken:", accessToken);
  if (!accessToken) {
    throw new Error("No access token found. User may not be authenticated.");
  }
  
  const createClient = useCallback(() => {
    const client = new Client({
      apiUrl,
      apiKey: accessToken || process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY,
      defaultHeaders: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    console.log("Client created with API URL:", apiUrl);
    return client;
  }, [accessToken, apiUrl]);

  const createThread = useCallback(async (assistantId: string) => {
    try {
      console.log("Creating thread for assistant:", assistantId);
      const client = createClient();
      console.log("Calling client.threads.create()");
      const thread = await client.threads.create();
      console.log("Thread created:", thread);
      return { thread_id: thread.thread_id };
    } catch (error) {
      console.error("Error creating thread:", error);
      throw error;
    }
  }, [createClient]);

  const getThreadState = useCallback(async (threadId: string, assistantId: string) => {
    try {
      console.log(`Getting state for thread: ${threadId}, assistant: ${assistantId}`);
      const client = createClient();
      console.log("Calling client.threads.getState()");
      const state = await client.threads.getState(threadId);
      console.log("Thread state received:", state);

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
      console.log(`Sending message to thread: ${threadId}, assistant: ${assistantId}`);
      console.log("Message content:", JSON.stringify(messages, null, 2));
      
      const client = createClient();
      console.log("Calling client.runs.stream()");
      
      // Log streamMode setting
      console.log("Using streamMode: 'updates'");
      
      const stream = await client.runs.stream(threadId, assistantId, {
        input: {
          messages,
        },
        streamMode: "updates",
      });
      
      console.log("Stream object received:", stream);
      
      // Check if stream has the expected methods
      console.log("Stream has forEach:", typeof stream.forEach === 'function');
      console.log("Stream has [Symbol.asyncIterator]:", typeof stream[Symbol.asyncIterator] === 'function');
      
      // Debug helper to preview the first chunk
      const debugStream = async () => {
        try {
          // Create a copy of the stream iterator
          const iterator = stream[Symbol.asyncIterator]();
          const firstChunk = await iterator.next();
          console.log("First stream chunk preview:", firstChunk);
          
          // Don't continue, as we're just previewing
          console.log("Stream preview complete - this was just a test");
        } catch (error) {
          console.error("Error previewing stream:", error);
        }
      };
      
      // Don't actually call this as it would consume the stream
      // debugStream();
      
      return stream;
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error details:", error.stack);
      throw error;
    }
  }, [createClient]);

  return {
    createThread,
    getThreadState,
    sendMessage,
  };
} 