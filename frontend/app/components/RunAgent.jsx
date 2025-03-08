"use client";

import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Paper,
    CircularProgress,
    Alert,
    Card,
    CardContent,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useSearchParams } from 'next/navigation';

const StyledContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    marginTop: theme.spacing(4),
}));

const RunButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: "12px 24px",
    width: "100%",
}));

const MessageCard = styled(Card)(({ theme, messagetype }) => ({
    marginBottom: theme.spacing(2),
    backgroundColor:
        messagetype === "error"
            ? theme.palette.error.light
            : messagetype === "completion"
            ? theme.palette.success.light
            : theme.palette.grey[100],
}));

export default function RunAgent() {
    const searchParams = useSearchParams();
    const agentId = searchParams.get('id');
    const [agent, setAgent] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [audioKey, setAudioKey] = useState(Date.now());

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await fetch(`/api/agents/${agentId}`);
                const data = await response.json();
                setAgent(data);
            } catch (error) {
                console.error("Error fetching agent:", error);
                setError("Failed to load agent details");
            }
        };

        if (agentId) {
            fetchAgent();
        }
    }, [agentId]);

    const handleRun = async () => {
        if (!prompt.trim()) {
            alert("Please enter a prompt");
            return;
        }

        setIsLoading(true);
        setMessages([]);
        setError(null);

        try {
            const response = await fetch(
                "http://127.0.0.1:8001/api/run/kokoro-tts-agent",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: prompt,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.detail || "Failed to start agent execution"
                );
            }

            const { session_id } = await response.json();
            const ws = new WebSocket(`ws://127.0.0.1:8001/ws/${session_id}`);

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);

                if (message.type === "error") {
                    setError(message.content);
                    setIsLoading(false);
                    ws.close();
                    return;
                }

                setMessages((prevMessages) => [...prevMessages, message]);

                if (message.type === "completion") {
                    setIsLoading(false);
                    setAudioKey(Date.now());
                    ws.close();
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                setError("Connection error occurred");
                setIsLoading(false);
            };
        } catch (error) {
            console.error("Error running agent:", error);
            setError(error.message);
            setIsLoading(false);
        }
    };

    if (!agent) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <StyledPaper elevation={3}>
            <Typography variant="h4" component="h1" gutterBottom>
                {agent.name}
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
                {agent.description}
            </Typography>

            <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your text here..."
                disabled={isLoading}
                sx={{ mb: 2 }}
            />

            <RunButton
                variant="contained"
                color="primary"
                onClick={handleRun}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Processing...</span>
                    </Box>
                ) : (
                    "Run Agent"
                )}
            </RunButton>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            <Box mt={4}>
                {messages.map((message, index) => (
                    <MessageCard
                        key={index}
                        messagetype={message.type}
                        variant="outlined"
                    >
                        <CardContent>
                            <Typography
                                color={
                                    message.type === "error"
                                        ? "error"
                                        : "textPrimary"
                                }
                            >
                                {message.content}
                            </Typography>
                        </CardContent>
                    </MessageCard>
                ))}
            </Box>

            {messages.some((m) => m.type === "completion") && (
                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Generated Audio
                    </Typography>
                    <Box
                        component="audio"
                        controls
                        key={audioKey}
                        sx={{ width: "100%" }}
                    >
                        <source
                            src={`http://127.0.0.1:8001/outputs/combined_audio.wav?t=${audioKey}`}
                            type="audio/wav"
                        />
                        Your browser does not support the audio element.
                    </Box>
                </Box>
            )}
        </StyledPaper>
    );
} 