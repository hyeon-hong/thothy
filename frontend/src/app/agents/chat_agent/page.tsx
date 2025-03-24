"use client";

import { useRef, useState, useEffect } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { useLangGraphApi } from "@/lib/langgraph-api-component";
import { convertLangChainMessages, LangGraphMessageAccumulator, appendLangChainChunk } from "@assistant-ui/react-langgraph";
import { DebugPanel } from "@/components/debug-panel";
import { LangGraphStreamAdapter } from "@/lib/langgraph-stream-adapter";

export default function Home() {
  const threadIdRef = useRef<string | undefined>();
  const assistantId = "chat_graph";
  const { createThread, getThreadState, sendMessage } = useLangGraphApi();
  const [debugInfo, setDebugInfo] = useState<string>("");
  const streamAdapterRef = useRef<LangGraphStreamAdapter>(new LangGraphStreamAdapter());
  
  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (message) => {
      try {
        console.log("Sending message:", message);
        
        if (!threadIdRef.current) {
          console.log("Creating new thread");
          const { thread_id } = await createThread(assistantId);
          threadIdRef.current = thread_id;
          console.log("New thread created:", thread_id);
        }
        
        const threadId = threadIdRef.current;
        console.log("Using thread:", threadId);
        
        const stream = await sendMessage({
          threadId,
          messages: message,
          assistantId,
        });
        
        console.log("Stream received:", stream);
        
        // Test if the stream is valid
        if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
          console.error("Invalid stream object:", stream);
          setDebugInfo("Invalid stream response from server");
          
          // Return a minimal message to prevent UI from breaking
          return [{
            type: "assistant",
            content: "Sorry, there was an error processing your request. Please try again.",
            id: Date.now().toString()
          }];
        }
        
        // Reset the stream adapter for a new request
        streamAdapterRef.current.reset();
        
        // Process the stream using our custom adapter
        try {
          const processedMessages = await streamAdapterRef.current.processStream(stream);
          console.log("Processed stream messages:", processedMessages);
          
          // If no messages were processed, return a fallback
          if (!processedMessages || processedMessages.length === 0) {
            setDebugInfo("No messages were generated from the stream");
            return [{
              type: "assistant",
              content: "No response was generated. Please try again.",
              id: Date.now().toString()
            }];
          }
          
          // Return the processed messages
          return processedMessages;
        } catch (streamError) {
          console.error("Error processing stream:", streamError);
          setDebugInfo(`Stream processing error: ${streamError.message}`);
          
          return [{
            type: "assistant",
            content: `Error processing response: ${streamError.message}. Please try again.`,
            id: Date.now().toString()
          }];
        }
      } catch (error) {
        console.error("Error in stream function:", error);
        setDebugInfo(`Error: ${error.message}`);
        
        // Return a minimal message to prevent UI from breaking
        return [{
          type: "assistant",
          content: `Sorry, there was an error: ${error.message}. Please try again.`,
          id: Date.now().toString()
        }];
      }
    },
    onSwitchToNewThread: async () => {
      try {
        console.log("Switching to new thread");
        const { thread_id } = await createThread(assistantId);
        threadIdRef.current = thread_id;
        console.log("New thread created for switch:", thread_id);
        return { thread_id };
      } catch (error) {
        console.error("Error switching to new thread:", error);
        setDebugInfo(`Error switching threads: ${error.message}`);
        throw error;
      }
    },
    onSwitchToThread: async (threadId) => {
      try {
        console.log("Switching to existing thread:", threadId);
        const state = await getThreadState(threadId, assistantId);
        threadIdRef.current = threadId;
        console.log("Thread state:", state);
        return {
          messages: state.values.messages,
          interrupts: state.tasks[0]?.interrupts,
        };
      } catch (error) {
        console.error("Error switching to thread:", error);
        setDebugInfo(`Error getting thread state: ${error.message}`);
        throw error;
      }
    },
  });

  return (
    <>
      <AssistantRuntimeProvider runtime={runtime}>
        <main className="h-dvh grid grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
          <ThreadList />
          <Thread />
          {debugInfo && (
            <div className="fixed bottom-0 left-0 right-0 bg-red-100 p-2 text-red-700 text-sm z-50">
              {debugInfo}
            </div>
          )}
        </main>
      </AssistantRuntimeProvider>
      <DebugPanel />
    </>
  );
}
