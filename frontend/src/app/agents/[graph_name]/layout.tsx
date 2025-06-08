'use client';

import { ReactNode, useState } from "react";
import Header from "@/components/Header";
import { usePathname, useParams } from "next/navigation";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";

interface AgentLayoutProps {
  children: React.ReactNode;
  params: { graph_name: string };
}

export default function AgentLayout({
  children,
  params,
}: AgentLayoutProps) {
  const pathname = usePathname();
  const urlParams = useParams();
  const { session, loading } = useAuth();
  
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname
    if (pathname?.includes('/agents/')) {
      return 'agents' as const;
    }
    return 'find' as const;
  });

  // Get assistantId from URL params or params prop
  const assistantId = (urlParams?.graph_name as string) || params?.graph_name;
  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;

  // Show loading for authentication (only for routes that need auth)
  if (loading) {
    return <div>Loading authentication...</div>;
  }

  // For routes that require authentication, check session
  if (!session?.access_token && assistantId === 'chat_graph') {
    return <div>Loading authentication...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with higher z-index to ensure clicks work */}
      <div className="z-50 relative">
        <Header currentView={currentView} />
      </div>
      
      {/* Content area with providers */}
      <div className="flex-1 overflow-hidden">
        <React.Suspense fallback={<div>Loading (layout)...</div>}>
          <Toaster />
          <ThreadProvider assistantId={assistantId} apiUrl={apiUrl}>
            <StreamProvider assistantId={assistantId} apiUrl={apiUrl}>
              <ArtifactProvider>
                {children}
              </ArtifactProvider>
            </StreamProvider>
          </ThreadProvider>
        </React.Suspense>
      </div>
    </div>
  );
} 