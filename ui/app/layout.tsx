import type { Metadata } from "next";

import { CopilotKit } from "@copilotkit/react-core";

import "@copilotkit/react-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
    title: "CoAgents Starter",
    description: "CoAgents Starter",
};

export default function RootLayout({ children }: { children: any }) {
    return (
        <html lang="en">
            <body>
                <CopilotKit
                    agent="chat_graph"
                    runtimeUrl="/api/copilotkit"
                    // threadId="7ed19312-84c0-43b9-8861-40716ec13307"
                    chatOptions={{
                        configurable: {
                            user_id: "web-user",
                            supabase: "",
                            mem_assistant_id: "memory_graph",
                            model: "anthropic/claude-3-5-sonnet-20240620",
                            delay_seconds: 1,
                            system_prompt:
                                "You are a helpful UI assistant. You can interact with the webpage " +
                                "using actions like greetUser and setBackgroundColor. Be friendly and helpful!",
                        },
                    }}
                    showDevConsole={true}
                >
                    {children}
                </CopilotKit>
            </body>
        </html>
    );
}
