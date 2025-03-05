import React, { createContext, useContext, useState, useMemo } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { useThreadManager } from "../hooks/useThreadManager";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();
const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID ?? "chat_graph";
const DEPLOYMENT_URL = process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "";

export function ChatProvider({ children }) {
  const { session } = useAuth();

  const client = useMemo(() => {
    return new Client({
      apiUrl: DEPLOYMENT_URL,
      defaultHeaders: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
  }, [session?.access_token]);

  const {
    threads,
    currentThreadId,
    isLoading: isThreadsLoading,
    createNewThread,
    deleteThread,
    setCurrentThreadId,
    setThreads,
  } = useThreadManager(session?.user?.id || "default-user", client);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateNewThread = async () => {
    const thread = await createNewThread();
    if (thread) {
      setMessages([]);
      setCurrentThreadId(thread.thread_id);
    }
  };

  const sendMessage = async (threadId, message) => {
    if (!threadId || !message) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { text, role } = message;
      
      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      // Send the message
      const response = await fetch(`${DEPLOYMENT_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          threadId,
          message: {
            content: text,
            role: role || "user",
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${await response.text()}`);
      }
      
      // Handle streaming response
      const streamResponse = await response.json();
      
      return streamResponse;
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const switchThread = async (threadId) => {
    if (
      !threadId ||
      typeof threadId !== "string" ||
      !threadId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    ) {
      console.error("Invalid thread ID format");
      return;
    }

    try {
      setCurrentThreadId(threadId);
      setMessages([]); // Clear messages initially

      // Fetch thread data
      const thread = await client.threads.get(threadId, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (thread && thread.values?.messages) {
        const formattedMessages = thread.values.messages.map((msg) => ({
          role: msg.type === "human" ? "user" : "assistant",
          content: msg.content,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error switching thread:", error);
      setCurrentThreadId(null);
      setMessages([]);
    }
  };

  const contextValue = {
    messages,
    sendMessage,
    isLoading,
    threads,
    currentThreadId,
    createNewThread: handleCreateNewThread,
    switchThread,
    deleteThread,
    isThreadsLoading,
    error,
    client,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
