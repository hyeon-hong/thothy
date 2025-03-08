import React, { createContext, useContext, useState, useMemo } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { useThreadManager } from "../hooks/useThreadManager";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();
// Use localhost in development, environment variable in production
export function ChatProvider({ children, graph_name }) {
    const DEPLOYMENT_URL =
        process.env.NODE_ENV === "development"
            ? "http://localhost:2024"
            : process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "";
    console.log("DEPLOYMENT_URL", DEPLOYMENT_URL);
    console.log("process.env.NODE_ENV", process.env.NODE_ENV);
    console.log("process.env.NEXT_PUBLIC_DEPLOYMENT_URL", process.env.NEXT_PUBLIC_DEPLOYMENT_URL);

    const assistantId = graph_name || "chat_graph";
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
    } = useThreadManager(session?.user?.id, client, assistantId);

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
        console.log("sendMessage", {
            threadId,
            assistantId: effectiveAssistantId,
        });

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
                                // Filter for all messages with content, not just AI
                                const validMessages = data.messages.filter(
                                    (msg) =>
                                        msg.content &&
                                        typeof msg.content === "string"
                                );

                                // Process all valid messages
                                if (validMessages.length > 0) {
                                    // Get the latest message
                                    const latestMessage =
                                        validMessages[validMessages.length - 1];

                                    // Convert non-AI messages to AI format but preserve original type
                                    const processedMessage = {
                                        ...latestMessage,
                                        originalType:
                                            latestMessage.type !== "ai"
                                                ? latestMessage.type
                                                : undefined,
                                    };

                                    // Check if this is a new message (by ID if available or content)
                                    const messageId =
                                        processedMessage.id ||
                                        processedMessage.content;
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
                                                // Create the proper message structure based on type
                                                let messageContent =
                                                    processedMessage.content;

                                                // If there's an original type, prepend it to the content for clarity
                                                if (
                                                    processedMessage.originalType
                                                ) {
                                                    messageContent = `[${processedMessage.originalType}] ${messageContent}`;
                                                }

                                                newMessages[lastIndex] = {
                                                    role: "assistant",
                                                    content: messageContent,
                                                    originalType:
                                                        processedMessage.originalType,
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
                    // Make sure we preserve the originalType when finalizing the message
                    newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        isPartial: false,
                        // Ensure originalType is preserved (this is redundant but explicit)
                        originalType: newMessages[lastIndex].originalType,
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

    // Send a message specifically formatted as a topic message
    const sendTopicMessage = async (threadId, topicText, customAssistantId) => {
        console.log("======== call sendTopicMessage");
        // Use the component-level assistantId if no custom one is provided
        const effectiveAssistantId = customAssistantId || assistantId;
        console.log("sendTopicMessage", {
            threadId,
            assistantId: effectiveAssistantId,
        });

        if (!threadId || !topicText) return;

        // Add user message immediately with topic formatting
        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: `Topic: ${topicText}`,
                isTopic: true,
            },
        ]);

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

            // Make streaming request with topic format
            console.log("topicText", topicText);
            console.log("effectiveAssistantId", effectiveAssistantId);
            console.log("threadId", threadId);
            console.log("DEPLOYMENT_URL", DEPLOYMENT_URL);
            const response = await fetch(
                `${DEPLOYMENT_URL}/threads/${threadId}/runs/stream`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        assistant_id: effectiveAssistantId,
                        input: {
                            topic: topicText,
                        },
                        stream_mode: ["values"],
                    }),
                }
            );
            console.log("response", response);

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            // Process the stream - same as sendMessage
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
                                // Filter for all messages with content, not just AI
                                const validMessages = data.messages.filter(
                                    (msg) =>
                                        msg.content &&
                                        typeof msg.content === "string"
                                );

                                // Process all valid messages
                                if (validMessages.length > 0) {
                                    // Get the latest message
                                    const latestMessage =
                                        validMessages[validMessages.length - 1];

                                    // Convert non-AI messages to AI format but preserve original type
                                    const processedMessage = {
                                        ...latestMessage,
                                        originalType:
                                            latestMessage.type !== "ai"
                                                ? latestMessage.type
                                                : undefined,
                                    };

                                    // Check if this is a new message (by ID if available or content)
                                    const messageId =
                                        processedMessage.id ||
                                        processedMessage.content;
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
                                                // Create the proper message structure based on type
                                                let messageContent =
                                                    processedMessage.content;

                                                // If there's an original type, prepend it to the content for clarity
                                                if (
                                                    processedMessage.originalType
                                                ) {
                                                    messageContent = `[${processedMessage.originalType}] ${messageContent}`;
                                                }

                                                newMessages[lastIndex] = {
                                                    role: "assistant",
                                                    content: messageContent,
                                                    originalType:
                                                        processedMessage.originalType,
                                                    isPartial: true,
                                                    inResponseToTopic: true, // Mark that this is a response to a topic
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
                    // Make sure we preserve the originalType when finalizing the message
                    newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        isPartial: false,
                        // Ensure originalType and inResponseToTopic are preserved
                        originalType: newMessages[lastIndex].originalType,
                        inResponseToTopic:
                            newMessages[lastIndex].inResponseToTopic,
                    };
                }

                return newMessages;
            });
        } catch (err) {
            console.error("Error:", err.message);
            setError(err.message);
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
        sendTopicMessage,
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
