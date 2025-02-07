import { Container, Grid, Typography } from "@mui/material";
import AgentCard from "./AgentCard";
import { useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';

export default function MyAgents() {
    const { user } = useUser();
    const [selectedAgentId, setSelectedAgentId] = useState(null);
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

    const handleAgentSelect = (agentId) => {
        setSelectedAgentId(agentId);
        console.log(`Selected agent: ${agentId}`);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography
                variant="h3"
                component="h1"
                gutterBottom
                align="center"
            >
                My Agents
            </Typography>
            <Grid container spacing={4}>
                {myAgents.map((agent) => (
                    <Grid item key={agent.id} xs={12} sm={6} md={4}>
                        <AgentCard
                            agent={agent}
                            onSelect={handleAgentSelect}
                            userId={user?.id}
                        />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
} 