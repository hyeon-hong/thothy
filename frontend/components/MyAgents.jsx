import React from 'react';
import { Container, Grid, Typography } from "@mui/material";
import AgentCardWithRemove from "./AgentCardWithRemove";
import { useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';

export default function MyAgents() {
    const { user } = useUser();
    const [myAgents, setMyAgents] = useState([]);

    useEffect(() => {
        const fetchMyAgents = async () => {
            if (!user?.id) return;

            try {
                const response = await fetch(`/api/agent?userId=${user.id}`);
                const data = await response.json();
                // data contains UserAgent objects with agent details
                const agents = data.map(ua => ua.agent);
                setMyAgents(agents);
            } catch (error) {
                console.error('Error fetching my agents:', error);
            }
        };

        fetchMyAgents();
    }, [user?.id]);

    const handleAgentRemove = (agentId) => {
        setMyAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
    };

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography
                variant="h3"
                component="h1"
                gutterBottom
                align="center"
                sx={{
                    mb: 6,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                }}
            >
                My Agents
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
                {myAgents.map((agent) => (
                    <Grid item key={agent.id} xs={12} sm={6} md={4}>
                        <AgentCardWithRemove
                            agent={agent}
                            onRemove={handleAgentRemove}
                            userId={user?.id}
                        />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
} 