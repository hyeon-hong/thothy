"use client";

import React from "react";
import Header from "@/components/Header";
import AgentHub from "@/components/AgentHub";

export default function FindPage() {
  return (
    <div className="w-full">
      <Header currentView="find" />
      <AgentHub />
    </div>
  );
} 