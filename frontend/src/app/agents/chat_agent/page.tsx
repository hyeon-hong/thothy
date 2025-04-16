"use client";

import { useEffect, useRef } from "react";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { Thread } from "@/components/assistant-ui/thread";

import { createThread, getThreadState, sendMessage } from "./chatApi";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatAgentPage() {
  // Fetch access token from AuthContext
  const { supabase } = useAuth();
  const threadIdRef = useRef<string | undefined>(undefined);
  const accessTokenRef = useRef<string>("");

  useEffect(() => {
    const fetchAccessToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        accessTokenRef.current = session.access_token;
      }
    };
    fetchAccessToken();
  }, [supabase]);

  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (messages) => {
      if (!threadIdRef.current) {
        const { thread_id } = await createThread(accessTokenRef.current);
        threadIdRef.current = thread_id;
      }
      const threadId = threadIdRef.current;
      return sendMessage({
        threadId,
        messages: messages[0],
        accessToken: accessTokenRef.current,
      });
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread(accessTokenRef.current);
      threadIdRef.current = thread_id;
    },
    onSwitchToThread: async (threadId) => {
      const state = await getThreadState(threadId, accessTokenRef.current);
      threadIdRef.current = threadId;
      return {
        messages: state.values.messages,
        // Cast to any to avoid type conflicts with interrupts
        interrupts: state.tasks[0]?.interrupts as any,
      };
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}
