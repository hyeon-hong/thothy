"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';

export default function AgentsLayout({ children }) {
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname
    if (pathname.includes('/agents/')) {
      return 'agents';
    }
    return 'find';
  });

  return (
    <>
      <main>
        {children}
      </main>
    </>
  );
} 