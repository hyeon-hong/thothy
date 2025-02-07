'use client';

import { Container, Grid, Typography } from '@mui/material';
import AgentCard from '../components/AgentCard';
import Header from '../components/Header';
import MyAgents from '../components/MyAgents';
import { useState, useEffect } from 'react';

export default function Home({ user }) {
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // "home" or "myAgents"
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
  }, []);

  const handleAgentSelect = (agentId) => {
    setSelectedAgentId(agentId);
    // Add logic here to handle agent selection
    console.log(`Selected agent: ${agentId}`);
  };

  return (
    <>
      <Header onViewChange={setCurrentView} currentView={currentView} />
      {currentView === "home" ? (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Agent Hub
          </Typography>
          <Grid container spacing={4}>
            {agents.map((agent) => (
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
      ) : (
        <MyAgents userId={user?.id} />
      )}
    </>
  );
} 