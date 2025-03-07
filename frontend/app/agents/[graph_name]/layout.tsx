'use client';

import { ReactNode, useEffect, useState } from "react";
import Header from "../../components/Header";
import { usePathname } from "next/navigation";
import { navigateTo } from "../../../utils/navigation";

interface AgentLayoutProps {
  children: ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname or hash
    const hash = window.location.hash.replace('#', '');
    
    if (hash === 'find') {
      return 'find';
    } else if (hash === 'staff') {
      return 'staff';
    } else if (pathname?.includes('/agents/')) {
      return 'agents';
    }
    return 'find';
  });

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'find') {
        setCurrentView('find');
        // When on agent page, navigate to the main page
        navigateTo('find');
      } else if (hash === 'staff') {
        setCurrentView('staff');
        // When on agent page, navigate to the staff page
        navigateTo('staff');
      } else if (hash === '') {
        setCurrentView('landing');
        // When on agent page, navigate to the landing page
        navigateTo('landing');
      }
    };

    // Initial check
    if (window.location.hash) {
      handleHashChange();
    }

    // Listen for future hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Also listen for custom viewchange events
  useEffect(() => {
    const handleViewChange = (event: CustomEvent) => {
      if (event.detail && event.detail.view) {
        setCurrentView(event.detail.view);
      }
    };

    window.addEventListener('viewchange', handleViewChange as EventListener);
    
    return () => {
      window.removeEventListener('viewchange', handleViewChange as EventListener);
    };
  }, []);

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