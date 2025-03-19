"use client";

import { Login } from "@/app/agents/plan_agent/components/auth/login/Login";
import React, { useState, useEffect } from "react";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate a quick loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <main className="h-screen">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Login />
      )}
    </main>
  );
}
