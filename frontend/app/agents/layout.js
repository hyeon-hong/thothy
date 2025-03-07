"use client";

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { usePathname } from 'next/navigation';
import { navigateTo } from '../../utils/navigation';

export default function AgentsLayout({ children }) {
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState(() => {
    // Determine initial view based on pathname or hash
    const hash = window.location.hash.replace('#', '');
    
    if (hash === 'find') {
      return 'find';
    } else if (hash === 'staff') {
      return 'staff';
    } else if (pathname.includes('/agents/')) {
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
        // When on a different page, we need to navigate to the main page
        if (pathname.includes('/agents/')) {
          navigateTo('find');
        }
      } else if (hash === 'staff') {
        setCurrentView('staff');
        // When on a different page, we need to navigate to the staff page
        if (pathname.includes('/agents/')) {
          navigateTo('staff');
        }
      } else if (hash === '') {
        setCurrentView('landing');
        // When on a different page, we need to navigate to the landing page
        if (pathname.includes('/agents/')) {
          navigateTo('landing');
        }
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
  }, [pathname]);

  // Also listen for custom viewchange events
  useEffect(() => {
    const handleViewChange = (event) => {
      if (event.detail && event.detail.view) {
        setCurrentView(event.detail.view);
      }
    };

    window.addEventListener('viewchange', handleViewChange);
    
    return () => {
      window.removeEventListener('viewchange', handleViewChange);
    };
  }, []);

  return (
    <>
      <Header currentView={currentView} />
      <main>
        {children}
      </main>
    </>
  );
} 