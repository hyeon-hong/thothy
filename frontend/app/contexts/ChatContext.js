import React, { createContext, useContext, useState, useMemo } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { useThreadManager } from "../hooks/useThreadManager";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();
const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID ?? "chat_graph";
const DEPLOYMENT_URL = process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "";

export function ChatProvider({ children, graph_name }) {
    const assistantId = graph_name || ASSISTANT_ID;
    const { session } = useAuth();

    const client = useMemo(() => {
        return new Client({
            apiUrl: DEPLOYMENT_URL,
            defaultHeaders: {
                Authorization: `Bearer ${session?.access_token}`,
            },
        });
    }, [session?.access_token]);

    const {
        threads,
        currentThreadId,
        isLoading: isThreadsLoading,
        createNewThread,
        deleteThread,
        setCurrentThreadId,
        setThreads,
    } = useThreadManager(session?.user?.id, client);

    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCreateNewThread = async () => {
        const thread = await createNewThread();
        if (thread) {
            setMessages([]);
            setCurrentThreadId(thread.thread_id);
        }
    };

    const sendMessage = async (threadId, message, customAssistantId) => {
        // Use the component-level assistantId if no custom one is provided
        const effectiveAssistantId = customAssistantId || assistantId;
        console.log("sendMessage", { threadId, assistantId: effectiveAssistantId });

        if (!threadId || !message) return;

        const { text, role } = message;

        // Add user message immediately
        setMessages((prev) => [...prev, { role: "user", content: text }]);

        // Add initial assistant placeholder (this will be our only assistant message)
        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "...", isPartial: true },
        ]);

        setIsLoading(true);
        setError(null);

        try {
            // Prepare headers
            const headers = {
                "Content-Type": "application/json",
            };

            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            // Make streaming request
            const response = await fetch(
                `${DEPLOYMENT_URL}/threads/${threadId}/runs/stream`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        assistant_id: effectiveAssistantId,
                        input: {
                            messages: [{ role: role || "user", content: text }],
                        },
                        stream_mode: ["values"],
                    }),
                }
            );

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            // Process the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let latestMessageId = null; // Track the latest message ID to prevent duplicates

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode chunk
                const chunk = decoder.decode(value, { stream: true });

                // Look for AI messages in values events
                if (
                    chunk.includes("event: values") &&
                    chunk.includes("data:")
                ) {
                    try {
                        // Extract data
                        const dataMatch = chunk.match(/data: ({.*})/);
                        if (dataMatch) {
                            const data = JSON.parse(dataMatch[1]);

                            // Find AI message - look for the latest one
                            if (data.messages && Array.isArray(data.messages)) {
                                // Filter for AI messages with content
                                const aiMessages = data.messages.filter(
                                    (msg) =>
                                        msg.type === "ai" &&
                                        msg.content &&
                                        typeof msg.content === "string"
                                );

                                // If we have AI messages, take the latest one
                                if (aiMessages.length > 0) {
                                    const latestAI =
                                        aiMessages[aiMessages.length - 1];

                                    // Check if this is a new message (by ID if available or content)
                                    const messageId =
                                        latestAI.id || latestAI.content;
                                    if (messageId !== latestMessageId) {
                                        latestMessageId = messageId;

                                        // Only update the last message in our messages array
                                        setMessages((prev) => {
                                            const newMessages = [...prev];
                                            const lastIndex =
                                                newMessages.length - 1;

                                            if (
                                                lastIndex >= 0 &&
                                                newMessages[lastIndex].isPartial
                                            ) {
                                                newMessages[lastIndex] = {
                                                    role: "assistant",
                                                    content: latestAI.content,
                                                    isPartial: true,
                                                };
                                            }

                                            return newMessages;
                                        });
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing chunk:", e);
                    }
                }
            }

            // Finalize the message - make sure it's not partial anymore
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;

                if (lastIndex >= 0 && newMessages[lastIndex].isPartial) {
                    newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        isPartial: false,
                    };
                }

                return newMessages;
            });
        } catch (err) {
            console.error("Error:", err.message);
            setError(err.message);

            // Update placeholder with error
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;

                if (lastIdx >= 0 && newMessages[lastIdx].isPartial) {
                    newMessages[lastIdx] = {
                        role: "assistant",
                        content: `Error: ${err.message}`,
                        isError: true,
                        isPartial: false,
                    };
                }

                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const switchThread = async (threadId) => {
        if (
            !threadId ||
            typeof threadId !== "string" ||
            !threadId.match(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            )
        ) {
            console.error("Invalid thread ID format");
            return;
        }

        try {
            setCurrentThreadId(threadId);
            setMessages([]); // Clear messages initially

            // Fetch thread data
            const thread = await client.threads.get(threadId, {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                },
            });

            if (thread && thread.values?.messages) {
                const formattedMessages = thread.values.messages.map((msg) => ({
                    role: msg.type === "human" ? "user" : "assistant",
                    content: msg.content,
                }));
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error("Error switching thread:", error);
            setCurrentThreadId(null);
            setMessages([]);
        }
    };

    const contextValue = {
        messages,
        sendMessage,
        isLoading,
        threads,
        currentThreadId,
        createNewThread: handleCreateNewThread,
        switchThread,
        deleteThread,
        isThreadsLoading,
        error,
        client,
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
