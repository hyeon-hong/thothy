import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';

const HeadlineTypography = styled(Typography)({
  fontFamily: "'Roboto Mono', monospace",
  fontWeight: 700,
  letterSpacing: '0.5px',
});

const StyledCard = styled(Card)({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  transition: 'transform 0.3s ease-in-out, background-color 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
});

const SelectButton = styled(Button)({
  borderRadius: '8px',
  padding: '8px 16px',
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '1px',
  fontSize: '0.875rem',
});

const RunButton = styled(Button)({
  borderRadius: '8px',
  padding: '8px 16px',
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

export default function AgentCard({ agent, onSelect, isSelected: propIsSelected, showUnselect = false }) {
  const router = useRouter();
  const { user, supabase } = useUser();
  const [isSelected, setIsSelected] = useState(propIsSelected);

  useEffect(() => {
    const checkIfSelected = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_agents')
          .select()
          .eq('user_id', user.id)
          .eq('agent_id', agent.id)
          .maybeSingle();

        if (error) throw error;
        setIsSelected(!!data);
      } catch (error) {
        console.error('Error checking if agent is selected:', error);
      }
    };

    checkIfSelected();
  }, [user, agent.id, supabase]);

  const handleSelect = async () => {
    if (!user) {
      alert('Please login to select an agent');
      return;
    }

    try {
      if (isSelected) {
        return; // Do nothing if already selected
      }

      // Save user-agent relationship to Supabase
      const { error } = await supabase
        .from('user_agents')
        .insert({
          user_id: user.id,
          agent_id: agent.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error selecting agent:', error);
        alert('Failed to select agent. Please try again.');
        return;
      }

      setIsSelected(true);
      if (onSelect) {
        onSelect(agent.id);
      }
    } catch (error) {
      console.error('Error selecting agent:', error);
      alert('Failed to select agent. Please try again.');
    }
  };

  const handleUnselect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_agents')
        .delete()
        .eq('user_id', user.id)
        .eq('agent_id', agent.id);

      if (error) {
        console.error('Error unselecting agent:', error);
        alert('Failed to unselect agent. Please try again.');
        return;
      }

      setIsSelected(false);
      if (onSelect) {
        onSelect(agent.id);
      }
    } catch (error) {
      console.error('Error unselecting agent:', error);
      alert('Failed to unselect agent. Please try again.');
    }
  };

  const handleRun = () => {
    if (!user) {
      alert('Please login to run this agent');
      return;
    }
    
    router.push(`/agents?id=${agent.id}`);
  };

  return (
    <StyledCard 
      sx={{ 
        maxWidth: 345, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: isSelected ? 'rgba(237, 247, 237, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      }}
    >
      {agent.imageUrl && (
        <CardMedia
          component="img"
          height="140"
          image={agent.imageUrl}
          alt={agent.name}
          sx={{
            objectFit: 'cover',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <HeadlineTypography gutterBottom variant="h5" component="div">
          {agent.name}
        </HeadlineTypography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            lineHeight: 1.6,
            opacity: 0.8 
          }}
        >
          {agent.description}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
        {showUnselect ? (
          <>
            <SelectButton
              variant="contained"
              color="error"
              fullWidth
              onClick={handleUnselect}
            >
              Unselect
            </SelectButton>
            <RunButton
              variant="contained"
              fullWidth
              onClick={handleRun}
            >
              Run
            </RunButton>
          </>
        ) : (
          <>
            <SelectButton
              variant="contained"
              color={isSelected ? "success" : "primary"}
              fullWidth
              onClick={handleSelect}
              disabled={isSelected}
            >
              {isSelected ? 'Selected' : 'Select'}
            </SelectButton>
            <RunButton
              variant="contained"
              fullWidth
              onClick={handleRun}
            >
              Run
            </RunButton>
          </>
        )}
      </Box>
    </StyledCard>
  );
} 