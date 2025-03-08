"use client";

import "./index.css";
import React, { useEffect, useRef, useState } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Avatar,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

export default function OpenDeepResearchAgentPage({ graph_name }) {
    const inputRef = useRef(null);
    const { session } = useAuth();
    const [testReport, setTestReport] = useState(false);

    // Environment-aware deployment URL
    const deploymentUrl =
        process.env.NODE_ENV === "development"
            ? "http://localhost:2024"
            : process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "";
    const langSmithApiKey = process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY || "";

    // Initialize useStream with the graph_name as assistantId
    const thread = useStream({
        apiUrl: deploymentUrl,
        assistantId: graph_name || "open_deep_research_graph",
        messagesKey: "messages",
        apiKey: langSmithApiKey,
        defaultHeaders: {
            // Include authentication token from the session
            Authorization: session?.access_token
                ? `Bearer ${session.access_token}`
                : undefined,
        },
    });

    useEffect(() => {
        // Focus input when page mounts
        inputRef.current?.focus();

        // Add test functionality to display a sample final_report message
        // This is for development/testing only
        if (process.env.NODE_ENV === "development") {
            setTestReport(true);
        }

        const handleKeyPress = (e) => {
            // Check if the pressed key is "/" and no input/textarea is focused
            // Also don't handle key events if they occurred on navigation elements (buttons, links)
            const isNavElement = e.target.closest('button, a, [role="button"]');
            if (isNavElement) return;

            if (
                e.key === "/" &&
                !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
            ) {
                e.preventDefault(); // Prevent "/" from being typed
                inputRef.current?.focus();
            }
        };

        // Focus input when window gains focus but check if active element is not a navigation element
        const handleWindowFocus = () => {
            const isNavElement = document.activeElement?.closest(
                'button, a, [role="button"]'
            );
            if (!isNavElement) {
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

    // Form submission handler
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const message = formData.get("message");

        if (!message || message.trim() === "") return;

        // Submit the message to the thread
        thread.submit({
            topic: message,
        });

        // Reset the form
        e.target.reset();
        inputRef.current?.focus();
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 64px)",
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
                {thread.messages.map((message, index) => (
                    <Paper
                        key={message.id || index}
                        elevation={0}
                        sx={{
                            p: 2,
                            maxWidth: message.type === "final_report" ? "95%" : "80%",
                            alignSelf: "flex-start",
                            bgcolor: 
                                message.type === "final_report"
                                    ? "#f0f8ff" // Light blue background for final report
                                    : "white",  // Default background for other messages
                            borderRadius: 2,
                            border: message.type === "final_report" ? "1px solid #b3e5fc" : "none",
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
                                    bgcolor: message.type === "final_report" ? "#1e88e5" : "primary.main",
                                    width: 32,
                                    height: 32,
                                }}
                            >
                                {message.type === "final_report" ? "📄" : "AI"}
                            </Avatar>
                            <Box sx={{ width: "100%" }}>
                                {message.type === "final_report" && (
                                    <Typography 
                                        variant="subtitle1" 
                                        sx={{ 
                                            fontWeight: "bold", 
                                            color: "#1976d2",
                                            mb: 1 
                                        }}
                                    >
                                        Research Report
                                    </Typography>
                                )}
                                <Typography 
                                    variant="body1"
                                    sx={{
                                        whiteSpace: message.type === "final_report" ? "pre-wrap" : "normal",
                                        fontFamily: message.type === "final_report" ? "'Georgia', serif" : "inherit",
                                    }}
                                >
                                    {message.content}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                ))}

                {/* Test Final Report (for development only) */}
                {testReport && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            maxWidth: "95%",
                            alignSelf: "flex-start",
                            bgcolor: "#f0f8ff", // Light blue background for final report
                            borderRadius: 2,
                            border: "1px solid #b3e5fc",
                            mt: 2
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
                                    bgcolor: "#1e88e5",
                                    width: 32,
                                    height: 32,
                                }}
                            >
                                📄
                            </Avatar>
                            <Box sx={{ width: "100%" }}>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        fontWeight: "bold", 
                                        color: "#1976d2",
                                        mb: 1 
                                    }}
                                >
                                    Research Report (Test)
                                </Typography>
                                <Typography 
                                    variant="body1"
                                    sx={{
                                        whiteSpace: "pre-wrap",
                                        fontFamily: "'Georgia', serif",
                                    }}
                                >
                                    {`# Sample Research Report
                                    
## Introduction
This is a sample test report to verify the styling of the final_report message type.

## Key Findings
- The styling includes a distinct background color
- Special typography settings for better readability
- Proper formatting with pre-wrap for maintaining structure
- A dedicated icon in the avatar

## Conclusions
This test report helps confirm that the UI will correctly display research reports generated by the open_deep_research_graph.`}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                )}

                {/* Loading indicator */}
                {thread.isLoading && (
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
                            fullWidth
                            name="message"
                            placeholder="Type your message... (or press / to focus)"
                            variant="outlined"
                            size="medium"
                            inputRef={inputRef}
                            disabled={thread.isLoading}
                        />

                        {thread.isLoading ? (
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => thread.stop()}
                            >
                                Stop
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={thread.isLoading}
                            >
                                Send
                            </Button>
                        )}
                    </Box>
                </form>
            </Box>

            {/* Handle interrupts */}
            {thread.interrupt && (
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 100,
                        left: "50%",
                        transform: "translateX(-50%)",
                        bgcolor: "white",
                        p: 3,
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        width: "80%",
                        maxWidth: 600,
                        zIndex: 10,
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Agent needs your input
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {typeof thread.interrupt.value === "string"
                            ? thread.interrupt.value
                            : JSON.stringify(thread.interrupt.value)}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1,
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={() =>
                                thread.submit(undefined, {
                                    command: { resume: false },
                                })
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() =>
                                thread.submit(undefined, {
                                    command: { resume: true },
                                })
                            }
                        >
                            Continue
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
