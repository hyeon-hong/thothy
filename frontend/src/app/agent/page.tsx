"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AgentHub from "@/components/AgentHub";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AgentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
    setIsLoading(false);
  }, [user, router, loading]);

  if (loading || isLoading) {
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
    <div className="container mx-auto px-4 relative min-h-screen pb-24">
      <Header currentView="agent" />
      <div className="mt-4 mb-4 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-muted-foreground">Manage and launch your organization's agents</p>
      </div>
      <AgentHub />
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 py-4 px-4 flex justify-center gap-4 shadow-lg">
        <Button className="w-40" onClick={() => { /* TODO: handle select */ }}>Select</Button>
        <Button className="w-40" variant="outline" onClick={() => { /* TODO: handle run */ }}>Run</Button>
      </div>
    </div>
  );
} 