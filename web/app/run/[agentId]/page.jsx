'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';

const RunButton = styled(Button)({
  borderRadius: '8px',
  padding: '12px 24px',
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '1px',
  fontSize: '0.875rem',
  backgroundColor: '#bbdefb',
  color: '#1976d2',
  '&:hover': {
    backgroundColor: '#90caf9',
  },
});

export default function RunAgent({ params }) {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${params.agentId}`);
        const data = await response.json();
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
      }
    };

    if (params.agentId) {
      fetchAgent();
    }
  }, [params.agentId]);

  const handleRun = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    // TODO: Implement agent execution logic here
    console.log('Running agent with prompt:', prompt);
  };

  if (!agent) {
    return (
      <>
        <Header currentView="run" />
        <div>Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header currentView="run" />
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
          Run Agent
        </Typography>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                mb: 3
              }}
            >
              {agent.name}
            </Typography>
            
            <Typography
              variant="body1"
              sx={{ mb: 4, color: 'text.secondary' }}
            >
              {agent.description}
            </Typography>

            <Box component="form" noValidate sx={{ mt: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Enter your prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <RunButton
                fullWidth
                onClick={handleRun}
                disabled={!prompt.trim()}
              >
                Run Agent
              </RunButton>
            </Box>
          </Paper>
        </Container>
      </Container>
    </>
  );
} 