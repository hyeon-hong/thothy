"use client";

import { useRef } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { useLangGraphApi } from "@/lib/langgraph-api-component";

export default function Home() {
  const threadIdRef = useRef<string | undefined>();
  const assistantId = "chat_graph";
  const { createThread, getThreadState, sendMessage } = useLangGraphApi();
  
  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (message) => {
      if (!threadIdRef.current) {
        const { thread_id } = await createThread(assistantId);
        threadIdRef.current = thread_id;
      }
      const threadId = threadIdRef.current;
      return sendMessage({
        threadId,
        messages: message,
        assistantId,
      });
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread(assistantId);
      threadIdRef.current = thread_id;
    },
    onSwitchToThread: async (threadId) => {
      const state = await getThreadState(threadId, assistantId);
      threadIdRef.current = threadId;
      return {
        messages: state.values.messages,
        interrupts: state.tasks[0]?.interrupts,
      };
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <main className="h-dvh grid grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
        <ThreadList />
        <Thread />
      </main>
    </AssistantRuntimeProvider>
  );
}
