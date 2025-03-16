"use client";

import { useRef, useEffect } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { createThread, sendMessage } from "./lib/chatApi";

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    console.log('[MyRuntimeProvider] Initialized');
    console.log('[MyRuntimeProvider] Children:', Array.isArray(children) ? children.length : 'single child');
  }, [children]);

  const threadIdRef = useRef<string | undefined>(undefined);
  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (messages) => {
      console.log('[MyRuntimeProvider] Streaming messages:', messages.length);
      if (!threadIdRef.current) {
        console.log('[MyRuntimeProvider] Creating new thread');
        const { thread_id } = await createThread();
        threadIdRef.current = thread_id;
        console.log('[MyRuntimeProvider] Thread created:', thread_id);
      }
      const threadId = threadIdRef.current;
      console.log('[MyRuntimeProvider] Sending message to thread:', threadId);
      return sendMessage({
        threadId,
        messages,
      });
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
