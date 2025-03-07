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

  return (
    <>
      <Header currentView={currentView} />
      <main>
        {children}
      </main>
    </>
  );
} 