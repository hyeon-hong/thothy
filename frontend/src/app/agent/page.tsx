"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AgentHub from "@/components/AgentHub";
import { useAuth } from "@/contexts/AuthContext";

export default function AgentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while auth is loading
    if (loading) return;

    // Only redirect if auth has finished loading and there's no user
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
  }, [user, router, loading]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="w-full">
        <Header currentView="agent" />
        <div className="flex justify-center items-center min-h-[200px]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Header currentView="agent" />
      <AgentHub />
    </div>
  );
} 