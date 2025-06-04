"use client";

import React from "react";
import Header from "@/components/Header";
import AgentHub from "@/components/AgentHub";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentPage() {
  const { user, loading } = useAuth();

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

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return null;
  }

  return (
    <div className="container mx-auto px-4 relative min-h-screen pb-24">
      <Header currentView="agent" />
      <div className="mt-4 mb-4 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-muted-foreground">Manage and launch your organization's agents</p>
      </div>
      <AgentHub />
    </div>
  );
} 