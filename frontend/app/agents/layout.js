"use client";

import React, { useState } from 'react';
import Header from '../components/Header';
import { useRouter, usePathname } from 'next/navigation';

export default function AgentsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname
    if (pathname.includes('/agents/')) {
      return 'agents';
    }
    return 'home';
  });

  const handleViewChange = (view) => {
    setCurrentView(view);
    
    // Handle navigation based on view
    if (view === 'home') {
      router.push('/');
    } else if (view === 'myAgents') {
      router.push('/my-agents');
    } else if (view === 'landing') {
      router.push('/');
    }
  };

  return (
    <>
      <Header currentView={currentView} onViewChange={handleViewChange} />
      <main>
        {children}
      </main>
    </>
  );
} 