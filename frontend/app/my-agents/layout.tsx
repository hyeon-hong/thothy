'use client';

import Header from '../components/Header';

export default function MyAgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView="staff" />
      <main>{children}</main>
    </div>
  );
} 