"use client";

import { Thread } from "@/components/thread";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatAgentPage(props: {
  apiUrl: string;
  assistantId: string;
}): React.ReactNode {
  const { session, loading } = useAuth();

  if (loading || !session?.access_token) {
    // Show loading spinner or redirect to login
    return <div>Loading authentication...</div>;
  }

  return <Thread />;
}
