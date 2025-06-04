"use client";

import { validate } from "uuid";
import type { Thread } from "@langchain/langgraph-sdk";
import { Client } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import {
  createContext,
  useContext,
  type ReactNode,
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  }
  return { graph_id: assistantId };
}

export function ThreadProvider({
  children,
  assistantId: assistantIdProp,
  apiUrl: apiUrlProp,
}: {
  children: ReactNode;
  assistantId?: string;
  apiUrl?: string;
}) {
  const [apiUrlQuery] = useQueryState("apiUrl");
  const apiUrl = apiUrlProp ?? apiUrlQuery;
  const [assistantIdQuery] = useQueryState("assistantId");
  const assistantId = assistantIdProp ?? assistantIdQuery;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const { session } = useAuth();

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];

    const accessToken = session?.access_token;
    if (!accessToken) {
      console.warn("No access token found. User might not be authenticated.");
      return [];
    }

    try {
      const client = new Client({
        apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY ?? undefined,
        apiUrl,
        defaultHeaders: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const threads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(assistantId),
        },
        limit: 100,
      });

      return threads;
    } catch (error: any) {
      console.error("Error fetching threads:", error);
      if (error.status === 403 || error.status === 401) {
        console.error(
          "Authentication error: User might not be logged in or session expired"
        );
        // You might want to redirect to login or refresh the session here
        throw new Error("Authentication failed: Please log in again");
      }
      throw error;
    }
  }, [apiUrl, assistantId, session?.access_token]);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
