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
        // Uncomment this if you want to use LangGraph JS, make sure to
        // remove the remote action url below too.
        //
        langGraphPlatformEndpoint({
            deploymentUrl: "http://localhost:8000",
            langsmithApiKey: process.env.LANGSMITH_API_KEY || "", // only used in LangGraph Platform deployments
            agents: [
                {
                    name: "chat_graph",
                    description: "A chat graph for a chatbot.",
                    assistantId: "9ffb3165-ee08-53d3-8cd9-fa32b19028a1",
                },
            ],
        }),
        // {
        //   url: process.env.REMOTE_ACTION_URL || "http://localhost:8000/copilotkit",
        // },
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
