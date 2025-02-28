"use client";

import React from "react";
import { Container, Grid, Typography, CircularProgress, Box } from "@mui/material";
import AgentCard from "./components/AgentCard";
import Header from "./components/Header";
import MyAgents from "./components/MyAgents";
import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

interface Agent {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    graph_name?: string;
    code?: string;
}

export default function Home() {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState("home"); // "home" or "myAgents"
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchAgents = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/agents");
                const data = await response.json();
                setAgents(data);
            } catch (error) {
                setAgents([]);
                // Handle error silently or show user-friendly message
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, []);

    useEffect(() => {
        const fetchSelectedAgents = async () => {
            if (!user?.id) {
                setSelectedAgentIds(new Set());
                return;
            }
            try {
                const response = await fetch(
                    `/api/agents/user?userId=${user.id}`
                );
                const data = await response.json();

                if (Array.isArray(data)) {
                    setSelectedAgentIds(new Set(data.map((agent: Agent) => agent.id)));
                } else {
                    setSelectedAgentIds(new Set());
                }
            } catch (error) {
                setSelectedAgentIds(new Set());
                // Handle error silently or show user-friendly message
            }
        };

        fetchSelectedAgents();
    }, [user?.id, currentView]);

    const handleAgentSelect = (agentId: string) => {
        setSelectedAgentIds((prev) => new Set([...prev, agentId]));
    };

    return (
        <>
            <Header onViewChange={setCurrentView} currentView={currentView} />
            {currentView === "home" ? (
                <Container maxWidth="lg" sx={{ py: 8 }}>
                    <Typography
                        variant="h3"
                        component="h1"
                        gutterBottom
                        align="center"
                        sx={{
                            mb: 6,
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Agent Hub
                    </Typography>
                    {loading ? (
                        <Box 
                            display="flex" 
                            justifyContent="center" 
                            alignItems="center" 
                            minHeight="300px"
                        >
                            <CircularProgress size={60} thickness={4} />
                        </Box>
                    ) : (
                        <Grid container spacing={4} sx={{ mt: 2 }}>
                            {agents.map((agent) => (
                                <Grid item key={agent.id} xs={12} sm={6} md={4}>
                                    <AgentCard
                                        agent={{
                                            ...agent,
                                            imageUrl: agent.image_url,
                                            graph_name: agent.graph_name || ''
                                        }}
                                        onSelect={handleAgentSelect}
                                        isSelected={selectedAgentIds.has(agent.id)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>
            ) : (
                <MyAgents />
            )}
        </>
    );
}
