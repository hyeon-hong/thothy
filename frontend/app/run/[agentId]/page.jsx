"use client";

import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";

const RunButton = styled(Button)({
    borderRadius: "8px",
    padding: "12px 24px",
    textTransform: "uppercase",
    fontWeight: 600,
    letterSpacing: "1px",
    fontSize: "0.875rem",
    backgroundColor: "#bbdefb",
    color: "#1976d2",
    "&:hover": {
        backgroundColor: "#90caf9",
    },
});

export default function RunAgent({ params }) {
    const router = useRouter();
    const [agent, setAgent] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await fetch(`/api/agents/${params.agentId}`);
                const data = await response.json();
                setAgent(data);
            } catch (error) {
                console.error("Error fetching agent:", error);
                setError("Failed to load agent details");
            }
        };

        if (params.agentId) {
            fetchAgent();
        }
    }, [params.agentId]);

    const handleRun = async () => {
        if (!prompt.trim()) {
            alert("Please enter a prompt");
            return;
        }

        setIsLoading(true);
        setMessages([]);
        setError(null);

        try {
            // Call the kokoro TTS agent API
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

            // Connect to WebSocket for real-time updates
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

                // Handle completion
                if (message.type === "completion") {
                    setIsLoading(false);
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
            <div className="container mx-auto p-4">
                <Header currentView="run" />
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Header currentView="run" />

            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">{agent.name}</h1>
                <p className="mb-4 text-gray-600">{agent.description}</p>

                <div className="mb-4">
                    <textarea
                        className="w-full p-2 border rounded"
                        rows="4"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your text here..."
                        disabled={isLoading}
                    />
                </div>

                <button
                    className={`w-full p-2 rounded text-white ${
                        isLoading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    onClick={handleRun}
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : "Run Agent"}
                </button>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="mt-4 space-y-2">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded ${
                                message.type === "error"
                                    ? "bg-red-100 text-red-700"
                                    : message.type === "completion"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100"
                            }`}
                        >
                            {message.content}
                        </div>
                    ))}
                </div>

                {messages.some((m) => m.type === "completion") && (
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">
                            Generated Audio
                        </h2>
                        <audio controls className="w-full">
                            <source
                                src={`http://127.0.0.1:8001/outputs/audio_0.wav`}
                                type="audio/wav"
                            />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}
            </div>
        </div>
    );
}
