'use client';

import { Container, Grid, Typography } from '@mui/material';
import AgentCard from '../components/AgentCard';
import Header from '../components/Header';
import { useState } from 'react';

// Temporary mock data - replace with actual API call later
const mockAgents = [
  {
    id: '1',
    name: 'General Assistant',
    description: 'A versatile AI assistant that can help with various tasks including writing, analysis, and answering questions.',
    imageUrl: '/images/assistant.png'
  },
  {
    id: '2',
    name: 'Code Expert',
    description: 'Specialized in programming assistance, code review, and software development guidance.',
    imageUrl: '/images/code.png'
  },
  {
    id: '3',
    name: 'Data Analyst',
    description: 'Expert in data analysis, visualization, and statistical interpretation.',
    imageUrl: '/images/data.png'
  }
];

export default function Home() {
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const handleAgentSelect = (agentId) => {
    setSelectedAgentId(agentId);
    // Add logic here to handle agent selection
    console.log(`Selected agent: ${agentId}`);
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Agent Hub
        </Typography>
        <Grid container spacing={4}>
          {mockAgents.map((agent) => (
            <Grid item key={agent.id} xs={12} sm={6} md={4}>
              <AgentCard 
                agent={agent} 
                onSelect={handleAgentSelect}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
} 