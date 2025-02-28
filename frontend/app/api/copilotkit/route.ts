import { NextRequest } from "next/server";
import {
    CopilotRuntime,
    copilotRuntimeNextJSAppRouterEndpoint,
    ExperimentalEmptyAdapter,
    langGraphPlatformEndpoint,
} from "@copilotkit/runtime";

const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
    remoteEndpoints: [
        langGraphPlatformEndpoint({
            deploymentUrl: "http://localhost:2024",
            langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
            agents: [
                {
                    name: "chat_graph",
                    description: "A chat graph for a chatbot.",
                },
            ],
        }),
    ],
});

export const POST = async (req: NextRequest) => {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime,
        serviceAdapter,
        endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
};
