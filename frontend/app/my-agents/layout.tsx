'use client';

import Header from '../components/Header';

export default function MyAgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="myAgents" />
      <main>{children}</main>
    </div>
  );
} 