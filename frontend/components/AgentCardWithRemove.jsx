import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

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
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
});

const StyledButton = styled(Button)({
  borderRadius: '8px',
  padding: '12px 24px',
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

export default function AgentCardWithRemove({ agent, onRemove, userId }) {
  const router = useRouter();

  const handleRemove = async () => {
    try {
      await fetch(`/api/agents/user?userId=${userId}&agentId=${agent.id}`, {
        method: 'DELETE'
      });
      onRemove(agent.id);
    } catch (error) {
      console.error('Error removing agent:', error);
      alert('Failed to remove agent. Please try again.');
    }
  };

  const handleClick = () => {
    router.push(`/agents?id=${agent.id}`);
  };

  return (
    <StyledCard sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        <StyledButton
          variant="contained"
          color="error"
          fullWidth
          onClick={handleRemove}
        >
          Remove
        </StyledButton>
        <RunButton
          variant="contained"
          fullWidth
          onClick={handleClick}
        >
          Run
        </RunButton>
      </Box>
    </StyledCard>
  );
} 