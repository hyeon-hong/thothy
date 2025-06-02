"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

export default function ChatAgentPage(props: {
  apiUrl: string;
  assistantId: string;
}): React.ReactNode {
  const apiUrl = props.apiUrl || process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  const assistantId = props.assistantId || "chat_graph";

  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <ThreadProvider assistantId={assistantId} apiUrl={apiUrl}>
        <StreamProvider assistantId={assistantId} apiUrl={apiUrl}>
          <ArtifactProvider>
            <Thread />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
