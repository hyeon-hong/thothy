"use client";

import React from "react";
import { useParams } from "next/navigation";
import Home from "@/app/agents/plan_agent/page";
import ChatAgentPage from "@/app/agents/chat_agent/page";
import DataAgentPage from "@/app/agents/data_agent/page";

export default function AgentPage() {
  const params = useParams();
  const graph_name = (params?.graph_name as string) || "chat_graph";
  // console.log("graph_name", graph_name);

  // Function to render the appropriate agent component
  const renderAgentComponent = () => {
    switch (graph_name) {
      case "chat_graph":
        return <ChatAgentPage />;
      case "plan_graph":
        return <Home />;
      case "data_graph":
        return <DataAgentPage />;
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Agent: {graph_name}</h1>
            <p className="text-gray-600">
              This agent type is not yet implemented.
            </p>
          </div>
        );
    }
  };

  return renderAgentComponent();
}
