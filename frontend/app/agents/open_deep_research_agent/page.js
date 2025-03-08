"use client";

import "./index.css";
import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Avatar,
    Alert,
    Snackbar,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

export default function OpenDeepResearchAgentPage({ graph_name }) {
    const inputRef = useRef(null);
    const { session } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [threadId, setThreadId] = useState(null);
    const eventSourceRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Environment-aware deployment URL
    const deploymentUrl =
        process.env.NODE_ENV === "development"
            ? "http://localhost:2024"
            : process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "";

    // Authentication headers
    const getHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: session?.access_token
            ? `Bearer ${session.access_token}`
            : "",
    });

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Create a new thread or use existing one
    useEffect(() => {
        const createThread = async () => {
            if (!session?.access_token) {
                console.warn(
                    "No access token available, skipping thread creation"
                );
                return;
            } else {
                console.log("Access token: ", session.access_token);
            }

            try {
                const response = await fetch(`${deploymentUrl}/threads`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        metadata: {
                            assistant_id:
                                graph_name || "open_deep_research_graph",
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error(
                        `Error creating thread: ${response.statusText}`
                    );
                }

                const data = await response.json();
                console.log("Thread created:", data);
                setThreadId(data.thread_id);
            } catch (err) {
                console.error("Error creating thread:", err);
                setError("Failed to create thread. Please try again.");
            }
        };

        if (!threadId) {
            createThread();
        }

        return () => {
            // Cleanup event source on unmount
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [session?.access_token, deploymentUrl, graph_name, threadId]);

    // Handle event source message
    const handleSSEMessage = (event) => {
        if (event.data === "[DONE]") {
            setIsLoading(false);
            return;
        }

        try {
            const data = JSON.parse(event.data);
            console.log("SSE data:", data);

            // Handle different types of events
            if (data.type === "final_report") {
                // Handle final report
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        type: "final_report",
                        content:
                            data.content ||
                            data.value ||
                            "Report generated successfully",
                    },
                ]);
            } else if (data.type) {
                // Handle any message with a type
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        type: data.type,
                        content:
                            data.content || data.value || "Response received",
                    },
                ]);
            } else if (data.value) {
                // Handle generic message
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        type: "ai",
                        content: data.value,
                    },
                ]);
            }

            scrollToBottom();
        } catch (err) {
            console.error("Error parsing SSE data:", err);
        }
    };

    // Submit a message
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const message = formData.get("message");

        if (!message || message.trim() === "") return;

        if (!session?.access_token) {
            setError("Authentication required. Please log in.");
            return;
        }

        if (!threadId) {
            setError("Thread not created. Please try again.");
            return;
        }

        // Close existing event source
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setIsLoading(true);

        try {
            // Create a new EventSource for streaming response
            const url = new URL(
                `${deploymentUrl}/threads/${threadId}/runs/stream`
            );

            // Prepare the request with the message
            const runRequest = {
                assistant_id: graph_name || "open_deep_research_graph",
                input: {
                    topic: message,
                },
                stream_mode: ["values", "events"],
            };

            // Make the POST request to start the stream
            const response = await fetch(url, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(runRequest),
            });

            if (!response.ok) {
                throw new Error(`Error creating run: ${response.statusText}`);
            }

            // Create EventSource for SSE
            const eventSource = new EventSource(url.toString());
            eventSourceRef.current = eventSource;

            eventSource.onmessage = handleSSEMessage;

            eventSource.onerror = (err) => {
                console.error("EventSource error:", err);
                eventSource.close();
                setIsLoading(false);
                setError("Error receiving responses. Please try again.");
            };

            // Add user message to messages
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    type: "ai", // Using "ai" because you mentioned there's no "human" type
                    content: message,
                },
            ]);

            // Reset the form
            e.target.reset();
            inputRef.current?.focus();
            scrollToBottom();
        } catch (err) {
            console.error("Error submitting message:", err);
            setIsLoading(false);
            setError(`Error: ${err.message}`);
        }
    };

    // Focus input when page loads
    useEffect(() => {
        inputRef.current?.focus();

        const handleKeyPress = (e) => {
            // Check if the pressed key is "/" and no input/textarea is focused
            const isNavElement = e.target.closest('button, a, [role="button"]');
            if (isNavElement) return;

            const activeElement = document.activeElement;
            const isInputFocused =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;

            if (e.key === "/" && !isInputFocused) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        const handleWindowFocus = () => {
            // Focus the input when the window gains focus, if no other input is focused
            const activeElement = document.activeElement;
            const isInputFocused =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;

            if (!isInputFocused) {
                inputRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyPress);
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            document.removeEventListener("keydown", handleKeyPress);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close error snackbar
    const handleCloseError = () => {
        setError(null);
    };

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#f5f5f5",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: "white",
                    borderBottom: "1px solid #e0e0e0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
            >
                <Typography variant="h6">
                    {graph_name || "Deep Research Agent"}
                </Typography>
            </Box>

            {/* Messages Area */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {messages.map((message, index) => {
                    // Debug logging for message data
                    console.log(`Message ${index}:`, message);
                    console.log(`Message ${index} type:`, message.type);

                    return (
                        <Paper
                            key={message.id || index}
                            elevation={0}
                            sx={{
                                p: 2,
                                maxWidth:
                                    message.type === "final_report"
                                        ? "95%"
                                        : "80%",
                                alignSelf: "flex-start",
                                bgcolor:
                                    message.type === "final_report"
                                        ? "#f0f8ff" // Light blue background for final report
                                        : "white", // Default background for other messages
                                borderRadius: 2,
                                border:
                                    message.type === "final_report"
                                        ? "1px solid #b3e5fc"
                                        : "none",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 1.5,
                                }}
                            >
                                <Avatar
                                    sx={{
                                        bgcolor:
                                            message.type === "final_report"
                                                ? "#1e88e5"
                                                : "primary.main",
                                        width: 32,
                                        height: 32,
                                    }}
                                >
                                    {message.type === "final_report"
                                        ? "📄"
                                        : "AI"}
                                </Avatar>
                                <Box sx={{ width: "100%" }}>
                                    {message.type === "final_report" && (
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: "bold",
                                                color: "#1976d2",
                                                mb: 1,
                                            }}
                                        >
                                            Research Report
                                        </Typography>
                                    )}
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            whiteSpace:
                                                message.type === "final_report"
                                                    ? "pre-wrap"
                                                    : "normal",
                                            fontFamily:
                                                message.type === "final_report"
                                                    ? "'Georgia', serif"
                                                    : "inherit",
                                        }}
                                    >
                                        {typeof message.content === "string"
                                            ? message.content
                                            : `[Content type: ${typeof message.content}] ${
                                                  typeof message.content ===
                                                  "object"
                                                      ? JSON.stringify(
                                                            message.content,
                                                            null,
                                                            2
                                                        )
                                                      : String(message.content)
                                              }`}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    );
                })}

                {/* Invisible element for scrolling to bottom */}
                <div ref={messagesEndRef} />

                {/* Loading indicator */}
                {isLoading && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            my: 2,
                        }}
                    >
                        <CircularProgress size={24} />
                    </Box>
                )}
            </Box>

            {/* Input Area */}
            <Box
                sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #e0e0e0" }}
            >
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            name="message"
                            placeholder="Type your research topic..."
                            fullWidth
                            variant="outlined"
                            inputRef={inputRef}
                            disabled={isLoading || !threadId}
                            InputProps={{
                                sx: { borderRadius: 2 },
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || !threadId}
                            sx={{ borderRadius: 2 }}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </Box>
                </form>
            </Box>

            {/* Error message */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseError}
                    severity="error"
                    sx={{ width: "100%" }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
