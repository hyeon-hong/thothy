"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

export default function ResearchAgentPage(props: {
  apiUrl: string;
  assistantId: string;
}): React.ReactNode {
  // In case of direct access to the page, use the provided apiUrl and assistantId
  // Otherwise, use the apiUrl and assistantId from props
  const apiUrl = props.apiUrl || process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  const assistantId = props.assistantId || "research_graph";
  console.log("assistantId: ", assistantId);

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
