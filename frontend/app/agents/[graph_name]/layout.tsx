'use client';

import { ReactNode } from "react";
import Header from "../../components/Header";

interface AgentLayoutProps {
  children: ReactNode;
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <>
      <Header currentView="home" onViewChange={() => {}} />
      {children}
    </>
  );
} 