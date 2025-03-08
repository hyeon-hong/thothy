"use client";

import "./index.css";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    CircularProgress,
    Avatar,
    Alert,
    Snackbar,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { Client } from "@langchain/langgraph-sdk";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const CURRENT_THREAD_ID_KEY = "openDeepResearchCurrentThreadId";

// Add constants for layout measurements at the top of the component
const HEADER_HEIGHT = 64; // Height of main header (blue bar)
const THREAD_BUTTON_HEIGHT = 84; // Increased from 72 to 84

export default function OpenDeepResearchAgentPage({ graph_name }) {
    const inputRef = useRef(null);
    const { session } = useAuth();
    const [formattedMessages, setFormattedMessages] = useState([]);
    const [expandedMessages, setExpandedMessages] = useState({});
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [threadId, setThreadId] = useState(null);
    const messagesEndRef = useRef(null);
    const [isThreadListLoading, setIsThreadListLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    // Environment-aware deployment URL
    const deploymentUrl =
        process.env.NODE_ENV === "development"
            ? "http://localhost:2024"
            : process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "";

    // Initialize LangGraph client
    const client = useRef(null);

    useEffect(() => {
        if (!session) return;

        if (session?.access_token) {
            client.current = new Client({
                apiUrl: deploymentUrl,
                defaultHeaders: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
        }
    }, [session?.access_token, deploymentUrl]);

    // Load current thread ID from local storage
    useEffect(() => {
        const savedThreadId = localStorage.getItem(CURRENT_THREAD_ID_KEY);
        if (savedThreadId) {
            setThreadId(savedThreadId);
        }
    }, []);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [formattedMessages]);

    // Fetch thread list
    const fetchThreads = async () => {
        if (!client.current) return;

        try {
            setIsThreadListLoading(true);
            console.log("Searching for threads with metadata filter:", {
                graphName: graph_name || "open_deep_research_agent",
                userId: session?.user?.id,
            });

            const threadList = await client.current.threads.search({
                limit: 100,
                metadata: {
                    // Match both fields we set when creating threads
                    graphName: graph_name || "open_deep_research_agent",
                    userId: session?.user?.id,
                },
            });
            console.log("Found threads:", threadList);
            setThreads(threadList);
        } catch (err) {
            console.error("Error fetching threads:", err);
            setError("Failed to load thread list");
        } finally {
            setIsThreadListLoading(false);
        }
    };

    // Create a new thread
    const createNewThread = async () => {
        if (!session?.access_token || !client.current) {
            console.warn("No access token or client available");
            return;
        }

        try {
            setIsLoading(true);
            const graphId = graph_name || "open_deep_research_agent";

            const thread = await client.current.threads.create({
                metadata: {
                    userId: session.user?.id,
                    graphName: graphId,
                    title: "New Thread", // Add a default title
                },
                graph_id: graphId, // Add the required graph_id parameter
            });

            // Set as current thread
            setThreadId(thread.thread_id);
            // Save to local storage
            localStorage.setItem(CURRENT_THREAD_ID_KEY, thread.thread_id);

            // Reset UI state for new thread
            setFormattedMessages([
                {
                    role: "assistant", 
                    content: "Welcome! Ask me a research question, and I'll help you find information."
                }
            ]);

            // Add initial message to thread state
            await client.current.threads.updateState(thread.thread_id, {
                values: [
                    {
                        role: "assistant",
                        content: "Welcome! Ask me a research question, and I'll help you find information."
                    },
                ],
            });

            // Refresh thread list
            console.log("Refreshing thread list after creating new thread");
            await fetchThreads();

            // Focus input
            inputRef.current?.focus();
        } catch (err) {
            console.error("Error creating thread:", err);
            setError("Failed to create a new thread. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Delete a thread
    const deleteThread = async (threadIdToDelete) => {
        console.log("Deleting thread:", threadIdToDelete);
        if (!client.current) return;

        try {
            const response = await client.current.threads.delete(
                threadIdToDelete
            );
            console.log("Thread deletion response:", response);

            // If the deleted thread is the current one
            if (threadIdToDelete === threadId) {
                // Remove from local storage
                localStorage.removeItem(CURRENT_THREAD_ID_KEY);

                // Clear current thread and messages
                setThreadId(null);
                setFormattedMessages([]);

                // If there are other threads, select the first one
                if (threads.length > 1) {
                    const remainingThread = threads.find(
                        (t) => t.thread_id !== threadIdToDelete
                    );
                    if (remainingThread) {
                        setThreadId(remainingThread.thread_id);
                        localStorage.setItem(
                            CURRENT_THREAD_ID_KEY,
                            remainingThread.thread_id
                        );
                    }
                }
            }

            // Refresh thread list
            console.log("Refreshing thread list after deleting thread");
            await fetchThreads();
        } catch (err) {
            console.error("Error deleting thread:", err);
            setError("Failed to delete thread. Please try again.");
        }
    };

    // Switch to a different thread
    const switchThread = async (newThreadId) => {
        if (newThreadId === threadId) return;

        try {
            setIsLoading(true);
            
            const threadState = await client.current.threads.getState(newThreadId);
            
            // Load thread messages
            const threadMessages = threadState.values.messages || [];
            if (threadMessages && Array.isArray(threadMessages)) {
                setFormattedMessages(threadMessages);
            } else {
                setFormattedMessages([
                    {
                        role: "assistant",
                        content: "Welcome! Ask me a research question, and I'll help you find information."
                    }
                ]);
            }
            
            // Update the current thread ID
            setThreadId(newThreadId);
            // Save to local storage
            localStorage.setItem(CURRENT_THREAD_ID_KEY, newThreadId);

            // The streamMessages useEffect will automatically set up streaming for this thread
        } catch (err) {
            console.error("Error switching thread:", err);
            setError("Failed to switch thread. Please try again.");
            
            // Reset UI
            setFormattedMessages([]);
            setIsLoading(false);
        }
    };

    // Load existing thread or create a new one
    useEffect(() => {
        if (!session?.access_token || !client.current) return;

        const initializeThread = async () => {
            // First fetch the thread list
            console.log("Fetching threads in initializeThread");
            await fetchThreads();

            // If we have a threadId from localStorage, try to load it
            if (threadId) {
                try {
                    const threadState = await client.current.threads.getState(
                        threadId
                    );
                    // If thread state exists, load its messages
                    if (threadState && threadState.values) {
                        if (Array.isArray(threadState.values.messages)) {
                            setFormattedMessages(threadState.values.messages);
                        } else {
                            // Add welcome message if no messages yet
                            setFormattedMessages([
                                {
                                    role: "assistant",
                                    content: "Welcome! Ask me a research question, and I'll help you find information."
                                },
                            ]);
                        }
                        // No need to return, we'll still set up streaming via the useEffect
                    }
                } catch (err) {
                    console.error("Error loading saved thread:", err);
                    // Clear invalid thread ID
                    localStorage.removeItem(CURRENT_THREAD_ID_KEY);
                    setThreadId(null);
                }
            }

            // If we don't have a valid thread ID or couldn't load it, check if we have any threads
            if (threads.length > 0) {
                // Use the first thread
                const firstThread = threads[0];
                setThreadId(firstThread.thread_id);
                localStorage.setItem(
                    CURRENT_THREAD_ID_KEY,
                    firstThread.thread_id
                );

                // Load its messages
                try {
                    const threadState = await client.current.threads.getState(
                        firstThread.thread_id
                    );
                    if (
                        threadState &&
                        threadState.values &&
                        Array.isArray(threadState.values.messages)
                    ) {
                        setFormattedMessages(threadState.values.messages);
                    } else {
                        setFormattedMessages([
                            {
                                role: "assistant",
                                content: "Welcome! Ask me a research question, and I'll help you find information."
                            },
                        ]);
                    }
                } catch (err) {
                    console.error("Error loading thread state:", err);
                    setFormattedMessages([
                        {
                            role: "assistant",
                            content: "Welcome! Ask me a research question, and I'll help you find information."
                        },
                    ]);
                }
            }
        };

        initializeThread();
    }, [session?.access_token, client.current]);

    // Fetch thread messages and start streaming
    const streamMessages = async (threadIdToStream) => {
        if (!client.current || !threadIdToStream) return;
        
        try {
            // First get current thread state
            const threadState = await client.current.threads.getState(threadIdToStream);
            
            // If thread state exists, load its messages
            if (threadState && threadState.values && Array.isArray(threadState.values.messages)) {
                setFormattedMessages(threadState.values.messages);
            }
            
            // Set up streaming for new messages
            setIsStreaming(true);
            
            // Create a streaming connection for this thread
            const stream = await client.current.runs.stream(
                threadIdToStream, 
                graph_name || "open_deep_research_agent",
                {
                    streamMode: "values"
                }
            );
            
            // Handle streaming updates
            for await (const chunk of stream) {
                console.log("chunk", chunk);
                
                if (chunk.event === "values" && chunk.data) {
                    // Process research data from the chunk
                    if (chunk.data.completed_sections && Array.isArray(chunk.data.completed_sections)) {
                        const formattedMessages = [];
                        
                        // Add assistant welcome message if it's the first message
                        formattedMessages.push({
                            role: "assistant",
                            content: "I'm researching information for you. Here's what I've found so far:"
                        });
                        
                        // Add each completed section as a message
                        chunk.data.completed_sections.forEach(section => {
                            if (section.content) {
                                formattedMessages.push({
                                    role: "assistant",
                                    content: section.content
                                });
                            }
                        });
                        
                        // Add sections information if available
                        if (chunk.data.sections && Array.isArray(chunk.data.sections)) {
                            formattedMessages.push({
                                role: "assistant",
                                content: `## All Sections (${chunk.data.sections.length} total)\n\n${chunk.data.sections.map(s => `- ${s.name}: ${s.description}`).join('\n')}`
                            });
                        }
                        
                        // Add report sections from research if available
                        if (chunk.data.report_sections_from_research) {
                            formattedMessages.push({
                                role: "assistant",
                                content: `## Report Sections From Research\n\n${chunk.data.report_sections_from_research}`
                            });
                        }
                        
                        // If there's a final report, add it
                        if (chunk.data.final_report) {
                            formattedMessages.push({
                                role: "assistant",
                                content: `# Final Report\n\n${chunk.data.final_report}`
                            });
                        }
                        
                        // If there's a topic, show it
                        if (chunk.data.topic) {
                            formattedMessages.push({
                                role: "assistant",
                                content: `Research topic: ${chunk.data.topic}`
                            });
                        }
                        
                        // Only update messages if we have content
                        if (formattedMessages.length > 0) {
                            setFormattedMessages(formattedMessages);
                            setIsLoading(false);
                        }
                    } else if (Array.isArray(chunk.data.messages)) {
                        // Handle standard message format if available
                        setFormattedMessages(chunk.data.messages);
                        setIsLoading(false);
                    } else {
                        console.log("Received values data:", chunk.data);
                    }
                }
            }
            
            return stream;
        } catch (err) {
            console.error("Error setting up stream:", err);
            setError("Failed to connect to message stream");
            setIsLoading(false);
            setIsStreaming(false);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userInput = inputRef.current.value.trim();
        if (!userInput || !threadId || !client.current) return;

        // Add user message to UI immediately
        setFormattedMessages((prev) => [...prev, { role: "user", content: userInput }]);

        inputRef.current.value = "";
        setIsLoading(true);

        try {
            // Set up streaming for this thread only when Send is clicked
            streamMessages(threadId)
                .catch(err => {
                    console.error("Error in stream setup:", err);
                });
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message. Please try again.");
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleWindowFocus = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    useEffect(() => {
        window.addEventListener("focus", handleWindowFocus);
        return () => {
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, []);

    const handleCloseError = () => {
        setError(null);
    };

    // Format timestamp for thread list
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";

        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else {
            return date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
            });
        }
    };

    // Debug function to help troubleshoot issues
    const logDebugInfo = () => {
        console.log("Client:", client.current);
        console.log("Thread ID:", threadId);
        console.log("Session:", session);
        console.log("Number of threads:", threads.length);
        console.log("Messages:", formattedMessages);
        console.log("Is Streaming:", isStreaming);
        console.log("Is Loading:", isLoading);
    };

    // Add debug button to UI
    const handleDebugClick = () => {
        logDebugInfo();
        setError("Debug information logged to console. Press F12 to view.");
    };

    // Set up streaming when thread ID changes
    useEffect(() => {
        if (!threadId || !client.current) return;

        let streamCleanup = null;

        // Clean up function to close stream when component unmounts or threadId changes
        return () => {
            if (streamCleanup) streamCleanup();
        };
    }, [threadId, client.current]);

    const toggleMessageExpansion = (index) => {
        setExpandedMessages(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column", // Change to column for proper header placement
                bgcolor: "#f5f5f5",
                overflow: "hidden",
            }}
        >
            {/* Main Header - Now properly positioned at the top level */}
            <Paper
                elevation={2}
                sx={{
                    p: 2,
                    borderRadius: 0,
                    bgcolor: "#1976d2",
                    height: `${HEADER_HEIGHT}px`,
                    zIndex: 20, // Highest z-index to stay on top
                }}
            >
                <Typography variant="h5" sx={{ color: "white" }}>
                    Open Deep Research Agent
                </Typography>
            </Paper>

            {/* Content area - row layout with sidebar and chat */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexGrow: 1,
                    height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                    overflow: "hidden",
                }}
            >
                {/* Thread List Sidebar */}
                <Box
                    sx={{
                        width: 280,
                        borderRight: "1px solid #e0e0e0",
                        bgcolor: "white",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        zIndex: 10,
                        height: "100%", // Full height of the content area
                        overflow: "hidden",
                    }}
                >
                    {/* New Thread button area */}
                    <Box
                        sx={{
                            p: 2,
                            borderBottom: "1px solid #e0e0e0",
                            display: "flex",
                            gap: 1,
                            position: "sticky",
                            top: 0,
                            backgroundColor: "white",
                            zIndex: 11,
                            height: `${THREAD_BUTTON_HEIGHT - 24}px`, // Adjusted padding calculation
                        }}
                    >
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={createNewThread}
                            disabled={isLoading || isThreadListLoading}
                            sx={{
                                height: "100%", // Fill container height
                                fontSize: "0.95rem", // Slightly larger text
                                fontWeight: 500, // Medium weight for better visibility
                            }}
                        >
                            New Thread
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleDebugClick}
                            size="small"
                            sx={{
                                height: "100%", // Fill container height
                                minWidth: "80px", // Ensure minimum width for better visibility
                            }}
                        >
                            Debug
                        </Button>
                    </Box>

                    {/* Thread List - Properly calculated height */}
                    <List
                        sx={{
                            flexGrow: 1,
                            overflow: "auto",
                            p: 0,
                            height: `calc(100% - ${THREAD_BUTTON_HEIGHT}px)`,
                        }}
                    >
                        {isThreadListLoading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    p: 2,
                                }}
                            >
                                <CircularProgress size={24} />
                            </Box>
                        ) : threads.length > 0 ? (
                            threads.map((thread) => (
                                <ListItem
                                    key={thread.thread_id}
                                    selected={thread.thread_id === threadId}
                                    onClick={() =>
                                        switchThread(thread.thread_id)
                                    }
                                    sx={{
                                        borderBottom: "1px solid #f0f0f0",
                                        bgcolor:
                                            thread.thread_id === threadId
                                                ? "#f0f7ff"
                                                : "inherit",
                                        "&:hover": {
                                            bgcolor:
                                                thread.thread_id === threadId
                                                    ? "#e3f2fd"
                                                    : "#f5f5f5",
                                        },
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            thread.metadata?.title ||
                                            `Thread ${thread.thread_id.substring(
                                                0,
                                                8
                                            )}...`
                                        }
                                        secondary={formatTimestamp(
                                            thread.created_at
                                        )}
                                        primaryTypographyProps={{
                                            noWrap: true,
                                            fontWeight:
                                                thread.thread_id === threadId
                                                    ? 600
                                                    : 400,
                                        }}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteThread(thread.thread_id);
                                            }}
                                            size="small"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))
                        ) : (
                            <Box sx={{ p: 2, textAlign: "center" }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No threads yet
                                </Typography>
                            </Box>
                        )}
                    </List>
                </Box>

                {/* Main Chat Area */}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        overflow: "hidden",
                    }}
                >
                    {/* Messages Container */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            overflow: "auto",
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {formattedMessages.map((message, index) => (
                            <Paper
                                key={index}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    maxWidth: "80%",
                                    alignSelf:
                                        message.role === "user"
                                            ? "flex-end"
                                            : "flex-start",
                                    bgcolor:
                                        message.role === "user"
                                            ? "#e3f2fd"
                                            : "white",
                                }}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    <Typography 
                                        variant="body1"
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: expandedMessages[index] ? 'unset' : 2,
                                            WebkitBoxOrient: 'vertical',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        {message.content}
                                    </Typography>
                                    
                                    {/* Only show expand button if content is long enough to need it */}
                                    {message.content.split('\n').length > 2 || message.content.length > 150 ? (
                                        <IconButton 
                                            size="small" 
                                            onClick={() => toggleMessageExpansion(index)}
                                            sx={{ 
                                                position: 'absolute', 
                                                bottom: -8, 
                                                right: -8,
                                                bgcolor: 'background.paper',
                                                border: '1px solid #e0e0e0',
                                                '&:hover': {
                                                    bgcolor: 'background.default',
                                                },
                                            }}
                                        >
                                            {expandedMessages[index] ? (
                                                <KeyboardArrowUpIcon fontSize="small" />
                                            ) : (
                                                <KeyboardArrowDownIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    ) : null}
                                </Box>
                            </Paper>
                        ))}
                        <div ref={messagesEndRef} />

                        {/* Loading indicator */}
                        {(isLoading || isStreaming) && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    mt: 2,
                                }}
                            >
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>

                    {/* Input Area */}
                    <Paper
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            borderTop: "1px solid #e0e0e0",
                            position: "relative",
                            zIndex: 5,
                        }}
                    >
                        <TextField
                            inputRef={inputRef}
                            fullWidth
                            placeholder="Ask a question..."
                            variant="outlined"
                            disabled={isLoading || isStreaming || !threadId}
                            onKeyPress={handleKeyPress}
                            multiline
                            maxRows={4}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ ml: 2 }}
                            type="submit"
                            disabled={isLoading || isStreaming || !threadId}
                        >
                            Send
                        </Button>
                    </Paper>
                </Box>
            </Box>

            {/* Error Snackbar */}
            <Snackbar
                open={error !== null}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                sx={{ zIndex: 25 }} // Ensure it's above everything
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
