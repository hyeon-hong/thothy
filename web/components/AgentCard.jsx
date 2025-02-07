import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';
import { saveUserAgent } from '../lib/db';

export default function AgentCard({ agent, onSelect, userId, isSelected }) {
  const handleSelect = async () => {
    if (!userId) {
      alert('Please login to select an agent');
      return;
    }

    try {
      if (isSelected) {
        return; // Do nothing if already selected
      }
      await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          agentId: agent.id,
        }),
      });
      onSelect(agent.id);
    } catch (error) {
      console.error('Error selecting agent:', error);
      alert('Failed to select agent. Please try again.');
    }
  };

  return (
    <Card sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {agent.imageUrl && (
        <CardMedia
          component="img"
          height="140"
          image={agent.imageUrl}
          alt={agent.name}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="div">
          {agent.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {agent.description}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2 }}>
        <Button 
          variant="contained" 
          color={isSelected ? "success" : "primary"}
          fullWidth 
          onClick={handleSelect}
          disabled={isSelected}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </Box>
    </Card>
  );
} 