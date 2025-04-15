"use client";

import { v4 as uuidv4, validate } from "uuid";
import {
  AgentInbox,
  HumanInterrupt,
  HumanResponse,
  ThreadData,
  ThreadStatusWithAll,
} from "@/components/agent-inbox/types";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/client";
import {
  Run,
  Thread,
  ThreadState,
  ThreadStatus,
} from "@langchain/langgraph-sdk";
import { END } from "@langchain/langgraph/web";
import React from "react";
import { useQueryParams } from "../hooks/use-query-params";
import {
  INBOX_PARAM,
  LIMIT_PARAM,
  OFFSET_PARAM,
  AGENT_INBOX_PARAM,
  AGENT_INBOXES_LOCAL_STORAGE_KEY,
  NO_INBOXES_FOUND_PARAM,
} from "../constants";
import {
  getInterruptFromThread,
  getThreadFilterMetadata,
  processInterruptedThread,
  processThreadWithoutInterrupts,
} from "./utils";
import { useLocalStorage } from "../hooks/use-local-storage";

// Define the ToastInput type that matches what useToast expects
type ToastInput = {
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

type ThreadContentType<
  ThreadValues extends Record<string, any> = Record<string, any>,
> = {
  loading: boolean;
  threadData: ThreadData<ThreadValues>[];
  hasMoreThreads: boolean;
  agentInboxes: AgentInbox[];
  deleteAgentInbox: (id: string) => void;
  changeAgentInbox: (graphId: string, replaceAll?: boolean) => void;
  addAgentInbox: (agentInbox: AgentInbox) => void;
  ignoreThread: (threadId: string) => Promise<void>;
  fetchThreads: (inbox: ThreadStatusWithAll) => Promise<void>;
  sendHumanResponse: <TStream extends boolean = false>(
    threadId: string,
    response: HumanResponse[],
    options?: {
      stream?: TStream;
    }
  ) => Promise<
    TStream extends true
      ?
          | AsyncGenerator<
              {
                event: Record<string, any>;
                data: any;
              },
              any,
              unknown
            >
          | undefined
      : Run | undefined
  >;
  fetchSingleThread: (threadId: string) => Promise<
    | {
        thread: Thread<ThreadValues>;
        status: ThreadStatus;
        interrupts: HumanInterrupt[] | undefined;
      }
    | undefined
  >;
  bulkGetThreadStates: (
    threadIds: string[]
  ) => Promise<
    { thread_id: string; thread_state: ThreadState<ThreadValues> }[]
  >;
  deleteThread: (threadId: string) => Promise<void>;
};

const ThreadsContext = React.createContext<ThreadContentType | undefined>(
  undefined
);

interface GetClientArgs {
  agentInboxes: AgentInbox[];
  getItem: (key: string) => string | null | undefined;
  toast: (input: ToastInput) => void;
}

const getClient = async ({ agentInboxes, getItem, toast }: GetClientArgs) => {
  if (agentInboxes.length === 0) {
    toast({
      title: "Error",
      description: "Agent inbox not found. Please add an inbox in settings.",
      variant: "destructive",
      duration: 3000,
    });
    return;
  }

  // Use the proxied URL consistently across the application
  const deploymentUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  const langchainApiKey =
    process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY || undefined;

  try {
    const client = await createClient({
      deploymentUrl,
      langchainApiKey,
    });

    return client;
  } catch (error: any) {
    console.error("Failed to create LangGraph client:", error);
    if (error.message?.includes("CORS")) {
      toast({
        title: "CORS Error",
        description:
          "Unable to connect to LangGraph API. Please check your configuration.",
        variant: "destructive",
        duration: 5000,
      });
    } else {
      toast({
        title: "Error",
        description:
          "Failed to connect to LangGraph API. Please check your configuration.",
        variant: "destructive",
        duration: 5000,
      });
    }
    return undefined;
  }
};

export function ThreadsProvider<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ children }: { children: React.ReactNode }) {
  const { getSearchParam, searchParams, updateQueryParams } = useQueryParams();
  const { getItem, setItem } = useLocalStorage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [threadData, setThreadData] = React.useState<
    ThreadData<ThreadValues>[]
  >([]);
  const [hasMoreThreads, setHasMoreThreads] = React.useState(true);
  const [agentInboxes, setAgentInboxes] = React.useState<AgentInbox[]>([]);

  const limitParam = searchParams.get(LIMIT_PARAM);
  const offsetParam = searchParams.get(OFFSET_PARAM);
  const inboxParam = searchParams.get(INBOX_PARAM);

  React.useEffect(() => {
    console.log("call useEffect");

    if (typeof window === "undefined") {
      console.log("window is undefined");
      console.log("window: ", window);
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        // Only fetch agent inboxes if we don't have any yet
        if (agentInboxes.length === 0) {
          await getAgentInboxes();
        } else {
          // If we already have agent inboxes, just fetch threads if needed
          const inboxSearchParam = getSearchParam(INBOX_PARAM) as ThreadStatusWithAll;
          if (inboxSearchParam && mounted) {
            await fetchThreads(inboxSearchParam);
          }
        }
      } catch (e) {
        console.error("Error occurred during initialization", e);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [limitParam, offsetParam, inboxParam]);

  const getAgentInboxes = React.useCallback(async () => {
    const agentInboxSearchParam = getSearchParam(AGENT_INBOX_PARAM);
    console.log(
      "[Debug] Fetching agent inboxes, search param:",
      agentInboxSearchParam
    );

    try {
      setLoading(true);
      // Fetch teams from the database with detailed error logging
      const requestBody = {
        action: "select",
        table: "teams",
        query: {
          select: "*",
          order: [{ column: "created_at", order: "desc" }]
        },
      };

      console.log("[Debug] Sending request to /api/supabase:", requestBody);

      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[Debug] Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Debug] API Error response:", errorText);
        throw new Error(`Failed to fetch teams: ${response.status} ${errorText}`);
      }

      const teams = await response.json();
      console.log("[Debug] Teams data:", teams);

      if (!teams || !Array.isArray(teams)) {
        console.error("[Debug] Invalid data format:", teams);
        throw new Error("Invalid data format from API");
      }

      if (!teams.length) {
        console.log("[Debug] No teams found in database");
        // Don't show welcome dialog even if no teams found
        setAgentInboxes([]);
        setLoading(false);
        return;
      }

      // Transform teams into AgentInbox format
      const parsedAgentInboxes: AgentInbox[] = teams.map((team: any) => ({
        id: team.id,
        // TODO: Handle project_graph later
        graphId: "team_graph",
        name: team.name,
        description: team.description,
        selected: false,
      }));
      console.log("[Debug] Transformed agent inboxes:", parsedAgentInboxes);

      // If there is no agent inbox search param, or the search param is not
      // a valid UUID, update search param
      if (!agentInboxSearchParam || !validate(agentInboxSearchParam)) {
        parsedAgentInboxes[0].selected = true;
        updateQueryParams(AGENT_INBOX_PARAM, parsedAgentInboxes[0].id);
        setAgentInboxes(parsedAgentInboxes);
        
        // Fetch threads for the first inbox
        const inboxSearchParam = getSearchParam(INBOX_PARAM) as ThreadStatusWithAll;
        if (inboxSearchParam) {
          await fetchThreads(inboxSearchParam);
        }
        return;
      }

      const selectedInbox = parsedAgentInboxes.find(
        (i) =>
          i.id === agentInboxSearchParam || i.graphId === agentInboxSearchParam
      );

      if (!selectedInbox) {
        toast({
          title: "Error",
          description:
            "Agent inbox not found. Please add an inbox in settings.",
          variant: "destructive",
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      parsedAgentInboxes.forEach((inbox) => {
        inbox.selected =
          inbox.id === agentInboxSearchParam ||
          inbox.graphId === agentInboxSearchParam;
      });

      setAgentInboxes(parsedAgentInboxes);
      
      // Fetch threads for the selected inbox
      const inboxSearchParam = getSearchParam(INBOX_PARAM) as ThreadStatusWithAll;
      if (inboxSearchParam) {
        await fetchThreads(inboxSearchParam);
      }
    } catch (error) {
      console.error("[Debug] Error fetching teams:", error);
      toast({
        title: "Error",
        description: "Failed to fetch agent inboxes. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const addAgentInbox = React.useCallback((agentInbox: AgentInbox) => {
    const agentInboxes = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
    if (!agentInboxes || !agentInboxes.length) {
      setAgentInboxes([agentInbox]);
      setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify([agentInbox]));
      updateQueryParams(AGENT_INBOX_PARAM, agentInbox.id);
      return;
    }
    const parsedAgentInboxes = JSON.parse(agentInboxes);
    parsedAgentInboxes.push(agentInbox);
    setAgentInboxes(parsedAgentInboxes);
    setItem(
      AGENT_INBOXES_LOCAL_STORAGE_KEY,
      JSON.stringify(parsedAgentInboxes)
    );
    updateQueryParams(AGENT_INBOX_PARAM, agentInbox.id);
  }, []);

  const deleteAgentInbox = React.useCallback((id: string) => {
    const agentInboxes = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
    if (!agentInboxes || !agentInboxes.length) {
      return;
    }
    const parsedAgentInboxes: AgentInbox[] = JSON.parse(agentInboxes);
    const updatedAgentInboxes = parsedAgentInboxes.filter((i) => i.id !== id);

    if (!updatedAgentInboxes.length) {
      updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
      setAgentInboxes([]);
      setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify([]));
      // Clear all query params
      const url = new URL(window.location.href);
      window.location.href = url.pathname;
      return;
    }

    setAgentInboxes(updatedAgentInboxes);
    setItem(
      AGENT_INBOXES_LOCAL_STORAGE_KEY,
      JSON.stringify(updatedAgentInboxes)
    );
    changeAgentInbox(updatedAgentInboxes[0].id, true);
  }, []);

  const changeAgentInbox = (id: string, replaceAll?: boolean) => {
    setAgentInboxes((prev) =>
      prev.map((i) => ({
        ...i,
        selected: i.id === id,
      }))
    );
    if (!replaceAll) {
      updateQueryParams(AGENT_INBOX_PARAM, id);
    } else {
      const url = new URL(window.location.href);
      const newParams = new URLSearchParams({
        [AGENT_INBOX_PARAM]: id,
      });
      const newUrl = url.pathname + "?" + newParams.toString();
      window.location.href = newUrl;
    }
  };

  const fetchThreads = React.useCallback(
    async (inbox: ThreadStatusWithAll) => {
      console.log("call fetchThreads");
      setLoading(true);

      try {
        const client = await getClient({
          agentInboxes,
          getItem,
          toast,
        });

        if (!client) {
          return;
        }

        const limitQueryParam = getSearchParam(LIMIT_PARAM);

        if (!limitQueryParam) {
          throw new Error("Limit query param not found");
        }

        const offsetQueryParam = getSearchParam(OFFSET_PARAM);

        if (!offsetQueryParam) {
          throw new Error("Offset query param not found");
        }

        const limit = Number(limitQueryParam);
        const offset = Number(offsetQueryParam);

        if (limit > 100) {
          toast({
            title: "Error",
            description: "Cannot fetch more than 100 threads at a time",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        const statusInput = inbox === "all" ? {} : { status: inbox };
        const metadataInput = getThreadFilterMetadata(agentInboxes);
        const threadSearchArgs = {
          offset,
          limit,
          ...statusInput,
          ...(metadataInput ? { metadata: metadataInput } : {}),
        };
        console.log("threadSearchArgs: ", threadSearchArgs);

        const threads = await client.threads.search(threadSearchArgs);
        const data: ThreadData<ThreadValues>[] = [];

        if (["interrupted", "all"].includes(inbox)) {
          const interruptedThreads = threads.filter(
            (t) => t.status === "interrupted"
          );

          const processedThreads = interruptedThreads
            .map((t) => {
              return processInterruptedThread(t as Thread<ThreadValues>);
            })
            .filter((t): t is ThreadData<ThreadValues> => {
              return !!t;
            });
          data.push(...processedThreads);

          const threadsWithoutInterrupts = interruptedThreads.filter((t) => {
            return !getInterruptFromThread(t)?.length;
          });

          if (threadsWithoutInterrupts.length > 0) {
            const states = await bulkGetThreadStates(
              threadsWithoutInterrupts.map((t) => t.thread_id)
            );

            const interruptedData = states.map((state) => {
              const thread = threadsWithoutInterrupts.find(
                (t) => t.thread_id === state.thread_id
              );
              if (!thread) {
                throw new Error(`Thread not found: ${state.thread_id}`);
              }
              return processThreadWithoutInterrupts(
                thread as Thread<ThreadValues>,
                state
              );
            });

            data.push(...interruptedData);
          }
        }

        threads.forEach((t) => {
          if (t.status === "interrupted") {
            return;
          }
          data.push({
            status: t.status,
            thread: t as Thread<ThreadValues>,
          });
        });

        const sortedData = data.sort((a, b) => {
          const dateA = new Date(b.thread.created_at).getTime();
          const dateB = new Date(a.thread.created_at).getTime();
          return dateA - dateB;
        });

        setThreadData(sortedData);
        setHasMoreThreads(threads.length === limit);
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to fetch threads",
          variant: "destructive",
          duration: 3000,
        });
      }
      setLoading(false);
    },
    [agentInboxes]
  );

  const fetchSingleThread = React.useCallback(
    async (
      threadId: string
    ): Promise<
      | {
          thread: Thread<ThreadValues>;
          status: ThreadStatus;
          interrupts: HumanInterrupt[] | undefined;
        }
      | undefined
    > => {
      const client = await getClient({
        agentInboxes,
        getItem,
        toast,
      });
      if (!client) {
        return undefined;
      }
      const thread = await client.threads.get(threadId);
      let threadInterrupts: HumanInterrupt[] | undefined;
      if (thread.status === "interrupted") {
        threadInterrupts = getInterruptFromThread(thread);
        if (!threadInterrupts || !threadInterrupts.length) {
          const state = await client.threads.getState(threadId);
          const { interrupts } = processThreadWithoutInterrupts(thread, {
            thread_state: state,
            thread_id: threadId,
          });
          threadInterrupts = interrupts;
        }
      }
      return {
        thread: thread as Thread<ThreadValues>,
        status: thread.status,
        interrupts: threadInterrupts,
      };
    },
    [agentInboxes]
  );

  const bulkGetThreadStates = React.useCallback(
    async (
      threadIds: string[]
    ): Promise<
      { thread_id: string; thread_state: ThreadState<ThreadValues> }[]
    > => {
      const client = await getClient({
        agentInboxes,
        getItem,
        toast,
      });
      if (!client) {
        return [];
      }
      const chunkSize = 25;
      const chunks = [];

      // Split threadIds into chunks of 25
      for (let i = 0; i < threadIds.length; i += chunkSize) {
        chunks.push(threadIds.slice(i, i + chunkSize));
      }

      // Process each chunk sequentially
      const results: {
        thread_id: string;
        thread_state: ThreadState<ThreadValues>;
      }[] = [];
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (id) => ({
            thread_id: id,
            thread_state: await client.threads.getState<ThreadValues>(id),
          }))
        );
        results.push(...chunkResults);
      }

      return results;
    },
    [agentInboxes]
  );

  const ignoreThread = async (threadId: string) => {
    const client = await getClient({
      agentInboxes,
      getItem,
      toast,
    });
    if (!client) {
      return;
    }
    try {
      await client.threads.updateState(threadId, {
        values: null,
        asNode: END,
      });

      setThreadData((prev) => {
        return prev.filter((p) => p.thread.thread_id !== threadId);
      });
      toast({
        title: "Success",
        description: "Ignored thread",
        duration: 3000,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to ignore thread",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const deleteThread = async (threadId: string) => {
    const client = await getClient({
      agentInboxes,
      getItem,
      toast,
    });
    if (!client) {
      return;
    }
    try {
      await client.threads.delete(threadId);

      setThreadData((prev) => {
        return prev.filter((p) => p.thread.thread_id !== threadId);
      });
      toast({
        title: "Success",
        description: "Thread deleted successfully",
        duration: 3000,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete thread",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const sendHumanResponse = async <TStream extends boolean = false>(
    threadId: string,
    response: HumanResponse[],
    options?: {
      stream?: TStream;
    }
  ): Promise<
    TStream extends true
      ?
          | AsyncGenerator<
              {
                event: Record<string, any>;
                data: any;
              },
              any,
              unknown
            >
          | undefined
      : Run | undefined
  > => {
    let graphId = agentInboxes.find((i) => i.selected)?.graphId;
    if (!graphId) {
      toast({
        title: "No assistant/graph ID found.",
        description:
          "Assistant/graph IDs are required to send responses. Please add an assistant/graph ID in the settings.",
        variant: "destructive",
      });
      return undefined as any;
    }
    console.log("graphId: ", graphId);

    const client = await getClient({
      agentInboxes,
      getItem,
      toast,
    });
    if (!client) {
      return undefined as any;
    }
    try {
      if (options?.stream) {
        return client.runs.stream(threadId, graphId, {
          command: {
            resume: response,
          },
          streamMode: "events",
        }) as any;
      }
      return client.runs.create(threadId, graphId, {
        command: {
          resume: response,
        },
      }) as any;
    } catch (e: any) {
      throw e;
    }
  };

  const contextValue: ThreadContentType = {
    loading,
    threadData,
    hasMoreThreads,
    agentInboxes,
    deleteAgentInbox,
    changeAgentInbox,
    addAgentInbox,
    ignoreThread,
    sendHumanResponse,
    fetchThreads,
    fetchSingleThread,
    bulkGetThreadStates,
    deleteThread,
  };

  return (
    <ThreadsContext.Provider value={contextValue}>
      {children}
    </ThreadsContext.Provider>
  );
}

export function useThreadsContext<
  T extends Record<string, any> = Record<string, any>,
>() {
  const context = React.useContext(ThreadsContext) as ThreadContentType<T>;
  if (context === undefined) {
    throw new Error("useThreadsContext must be used within a ThreadsProvider");
  }
  return context;
}
