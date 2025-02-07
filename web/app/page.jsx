'use client';

import { Container, Grid, Typography } from '@mui/material';
import AgentCard from '../components/AgentCard';
import Header from '../components/Header';
import MyAgents from '../components/MyAgents';
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

export default function Home() {
  const { user } = useUser();
  const [currentView, setCurrentView] = useState("home"); // "home" or "myAgents"
  const [agents, setAgents] = useState([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState(new Set());

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

  useEffect(() => {
    const fetchSelectedAgents = async () => {
      if (!user?.id) {
        setSelectedAgentIds(new Set());
        return;
      }
      try {
        const response = await fetch(`/api/agent?userId=${user.id}`);
        const data = await response.json();
        setSelectedAgentIds(new Set(data.map(ua => ua.agent.id)));
      } catch (error) {
        console.error('Error fetching selected agents:', error);
      }
    };

    fetchSelectedAgents();
  }, [user?.id, currentView]);

  const handleAgentSelect = (agentId) => {
    setSelectedAgentIds(prev => new Set([...prev, agentId]));
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
              letterSpacing: '-0.02em',
            }}
          >
            Agent Hub
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {agents.map((agent) => (
              <Grid item key={agent.id} xs={12} sm={6} md={4}>
                <AgentCard 
                  agent={agent} 
                  onSelect={handleAgentSelect}
                  userId={user?.id}
                  isSelected={selectedAgentIds.has(agent.id)}
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