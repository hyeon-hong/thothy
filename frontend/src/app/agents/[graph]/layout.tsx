'use client';

import { ReactNode, useState } from "react";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";

interface AgentLayoutProps {
  children: React.ReactNode;
  params: { graph_name: string };
}

export default function AgentLayout({
  children,
  params,
}: AgentLayoutProps) {
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname
    if (pathname?.includes('/agents/')) {
      return 'agents' as const;
    }
    return 'find' as const;
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Header with higher z-index to ensure clicks work */}
      <div className="z-50 relative">
        <Header currentView={currentView} />
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
} 