"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { ReactNode } from "react";

interface ChatAgentLayoutProps {
    children: ReactNode;
}

export default function ChatAgentLayout({ children }: ChatAgentLayoutProps) {
    return (
        <CopilotKit runtimeUrl="/api/copilotkit" agent="chat_graph">
            <div className="min-h-screen w-full">{children}</div>
        </CopilotKit>
    );
}
