"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';

export default function AgentsLayout({ children }) {
  const pathname = usePathname();
  console.log("current pathname", pathname)
  console.log("children", children)
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname
    if (pathname.includes('/agents/')) {
      return 'agents';
    }
    return 'find';
  });

  console.log("current view", currentView)

  return (
    <>
      <main>
        {children}
      </main>
    </>
  );
} 