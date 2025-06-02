"use client";

import React from "react";
import { useParams } from "next/navigation";
import ChatAgentPage from "@/app/agents/chat_agent/page";
import DataAgentPage from "@/app/agents/data_agent/page";
import ResearchAgentPage from "@/app/agents/research_agent/page";
import SlideAgentPage from "@/app/agents/slide_agent/page";
import SlideBuildAgentPage from "@/app/agents/slide_build_agent/page";
import UIAgentPage from "@/app/agents/ui_agent/page";
import UIBuildAgentPage from "@/app/agents/ui_build_agent/page";
import UIEvalAgentPage from "@/app/agents/ui_eval_agent/page";

export default function AgentPage() {
  // Get the assistantId from the URL
  const params = useParams();
  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  const assistantId = params?.graph_name as string;

  // Function to render the appropriate agent component
  const renderAgentComponent = () => {
    switch (assistantId) {
      case "chat_graph":
        return <ChatAgentPage apiUrl={apiUrl} assistantId={assistantId} />;
      case "data_graph":
        return <DataAgentPage apiUrl={apiUrl} assistantId={assistantId} />;
      case "research_graph":
        return <ResearchAgentPage apiUrl={apiUrl} assistantId={assistantId} />;
      case "slide_graph":
        return <SlideAgentPage apiUrl={apiUrl} assistantId={assistantId} />;
      case "slide_build_graph":
        return (
          <SlideBuildAgentPage apiUrl={apiUrl} assistantId={assistantId} />
        );
      case "ui_graph":
        return <UIAgentPage apiUrl={apiUrl} assistantId={assistantId} />;
      case "ui_eval_graph":
        return <UIEvalAgentPage apiUrl={apiUrl} assistantId={assistantId} />;
      case "ui_build_graph":
        return <UIBuildAgentPage apiUrl={apiUrl} assistantId={assistantId} />;
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Agent: {assistantId}</h1>
            <p className="text-gray-600">
              This agent type is not yet implemented.
            </p>
          </div>
        );
    }
  };

  return renderAgentComponent();
}
