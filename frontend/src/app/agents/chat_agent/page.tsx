"use client";

import { useRef, useEffect } from "react";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { Thread } from "@/components/assistant-ui/thread";

import { createThread, getThreadState, sendMessage, LangGraphClient } from "./chatApi";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatAgentPage() {
  const { session } = useAuth();
  const threadIdRef = useRef<string | undefined>(undefined);

  // Update LangGraphClient token when session changes
  useEffect(() => {
    const newToken = session?.access_token || "";
    console.log('Updating LangGraph client token:', newToken ? 'token present' : 'no token');
    LangGraphClient.updateAccessToken(newToken);
  }, [session]);

  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (messages) => {
      console.log('Stream called with messages:', messages);
      if (!threadIdRef.current) {
        console.log('Creating new thread...');
        const { thread_id } = await createThread();
        console.log('New thread created:', thread_id);
        threadIdRef.current = thread_id;
      }
      const threadId = threadIdRef.current;
      console.log('Sending message to thread:', threadId);
      try {
        const stream = await sendMessage({
          threadId,
          messages: messages[0],
        });
        console.log('Message stream received, type:', typeof stream);
        console.log('Stream:', stream);

        // Ensure we have a valid stream
        if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
          console.error('Invalid stream received');
          throw new Error('Invalid stream received');
        }

        // Return the stream directly - useLangGraphRuntime will handle the iteration
        return stream;
      } catch (error) {
        console.error('Error in stream function:', error);
        throw error;
      }
    },
    onSwitchToNewThread: async () => {
      console.log('Switching to new thread...');
      const { thread_id } = await createThread();
      console.log('New thread created for switch:', thread_id);
      threadIdRef.current = thread_id;
    },
    onSwitchToThread: async (threadId) => {
      console.log('Switching to existing thread:', threadId);
      const state = await getThreadState(threadId);
      console.log('Retrieved thread state:', state);
      threadIdRef.current = threadId;
      return {
        messages: state.values.messages || [],
        interrupts: state.tasks[0]?.interrupts as any,
      };
    },
  });

  console.log('Runtime object:', runtime);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
