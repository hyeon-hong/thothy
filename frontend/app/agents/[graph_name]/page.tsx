"use client";

import React from "react";
import { useParams } from "next/navigation";
import ChatAgentPage from "../chat_agent/page";
import OpenDeepResearchAgentPage from "../open_deep_research_agent/page";

export default function AgentPage() {
    const params = useParams();
    const graph_name = (params?.graph_name as string) || "chat_graph";
    console.log("graph_name", graph_name);

    // Function to render the appropriate agent component
    const renderAgentComponent = () => {
        switch (graph_name) {
            case "chat_graph":
                return <ChatAgentPage graph_name={graph_name} />;
            case "open_deep_research_graph":
                return <OpenDeepResearchAgentPage graph_name={graph_name} />;
            default:
                return (
                    <div className="container mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold mb-6">
                            Agent: {graph_name}
                        </h1>
                        <p className="text-gray-600">
                            This agent type is not yet implemented.
                        </p>
                    </div>
                );
        }
    };

    return renderAgentComponent();
}
