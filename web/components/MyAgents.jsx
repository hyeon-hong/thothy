import { Container, Grid, Typography } from "@mui/material";
import AgentCard from "./AgentCard";
import { useState } from "react";

// Temporary mock data - replace with actual API call later
const mockMyAgents = [
    {
        id: "1",
        name: "My Custom Assistant",
        description:
            "Personalized AI assistant configured for my specific needs.",
        imageUrl: "/images/assistant.png",
    },
    {
        id: "2",
        name: "My Code Helper",
        description:
            "Customized programming assistant with my preferred settings.",
        imageUrl: "/images/code.png",
    },
];

export default function MyAgents() {
    const [selectedAgentId, setSelectedAgentId] = useState(null);

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
                {mockMyAgents.map((agent) => (
                    <Grid item key={agent.id} xs={12} sm={6} md={4}>
                        <AgentCard
                            agent={agent}
                            onSelect={handleAgentSelect}
                        />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
} 