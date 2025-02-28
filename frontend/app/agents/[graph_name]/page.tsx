"use client";

import React from "react";
import { useParams } from "next/navigation";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import ChatAgentPage from "../chat_agent_copilotkit/page";
import ChatPage from "../chat_agent/page";

export default function AgentPage() {
    const params = useParams();
    const graph_name = params.graph_name as string;

    // CopilotKit configuration
    const copilotConfig = {
        runtimeUrl: "/api/copilotkit",
        agent: graph_name,
        // Backend configuration
        backend: {
            timeout: 30000, // 30 seconds
            streaming: true,
        },
        // UI configuration
        ui: {
            darkMode: true,
            markdown: true,
            codeHighlighting: true,
        },
    };

    // Function to render the appropriate agent component
    const renderAgentComponent = () => {
        console.log("graph_name", graph_name);
        switch (graph_name) {
            case "chat_graph":
                // return <ChatAgentPage />;
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

    return (
        <ChatPage />
        // <CopilotKit agent={graph_name} runtimeUrl="/api/copilotkit">
        //     <div className="min-h-screen w-full">
        //         <div className="container mx-auto px-4 py-8">
        //             <h1 className="text-3xl font-bold mb-6">
        //                 Agent: {graph_name}
        //             </h1>
        //             <CopilotPopup
        //                 labels={{
        //                     title: "AI Assistant",
        //                     initial: "Hi! I'm your AI assistant. How can I help you today?",
        //                 }}
        //             />
        //         </div>
        //     </div>
        // </CopilotKit>
    );
}
