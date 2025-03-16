'use client';

import { ReactNode, useState } from "react";
import Header from "../../components/Header";
import { usePathname } from "next/navigation";

interface AgentLayoutProps {
  children: ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname
    if (pathname?.includes('/agents/')) {
      return 'agents';
    }
    return 'find';
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