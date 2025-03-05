"use client";

import React from "react";
import { useParams } from "next/navigation";
import ChatPage from "../chat_agent/page";

export default function AgentPage() {
    const params = useParams();
    const graph_name = params?.graph_name as string || 'chat_graph';

    // Function to render the appropriate agent component
    const renderAgentComponent = () => {
        switch (graph_name) {
            case "chat_graph":
                return <ChatPage />;
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

    return <ChatPage />;
}
