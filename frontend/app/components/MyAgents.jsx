import React from "react";
import { Container, Grid, Typography, Box } from "@mui/material";
import AgentCard from "./AgentCard";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";

export default function MyAgents() {
    const supabase = createClient();
    const { user } = useAuth();
    const [myAgents, setMyAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyAgents = async () => {
            if (!user?.id) {
                setMyAgents([]);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("user_agents")
                    .select(
                        `
                        agent_id,
                        agents:agent_id (
                            id,
                            name,
                            description,
                            image_url,
                            graph_name,
                            code
                        )
                    `
                    )
                    .eq("user_id", user.id);

                if (error) {
                    throw error;
                }

                // Transform the data to match the expected format
                const agents = data.map((ua) => ({
                    ...ua.agents,
                    imageUrl: ua.agents.image_url,
                    graph_name: ua.agents.graph_name,
                }));

                setMyAgents(agents);
            } catch (error) {
                setMyAgents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMyAgents();
    }, [user?.id, supabase]);

    const handleAgentUnselect = async (agentId) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("user_agents")
                .delete()
                .eq("user_id", user.id)
                .eq("agent_id", agentId);

            if (error) {
                throw error;
            }

            setMyAgents((prevAgents) =>
                prevAgents.filter((agent) => agent.id !== agentId)
            );
        } catch (error) {
            console.error("Failed to unselect agent:", error);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography>Loading your agents...</Typography>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography>Please sign in to view your agents.</Typography>
            </Container>
        );
    }

    if (myAgents.length === 0) {
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
                        letterSpacing: "-0.02em",
                    }}
                >
                    Your Staff
                </Typography>
                <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        You haven&apos;t selected any staff yet.
                    </Typography>
                </Box>
            </Container>
        );
    }

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
                    letterSpacing: "-0.02em",
                }}
            >
                Your Staff
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
                {myAgents.map((agent) => (
                    <Grid item key={agent.id} xs={12} sm={6} md={4}>
                        <AgentCard
                            agent={agent}
                            isSelected={true}
                            showUnselect={true}
                            onSelect={handleAgentUnselect}
                        />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}
