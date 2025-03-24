"use client";

import React from 'react';
import Header from '@/components/Header';

export default function Page() {
  return (
    <div>
      <Header currentView="project" />
      <div style={{ padding: '2rem' }}>
        <h1>Projects</h1>
        <p>This is the projects page.</p>
      </div>
    </div>
  );
} 