import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';

export default function AgentCardWithRemove({ agent, onRemove, userId }) {
  const handleRemove = async () => {
    try {
      await fetch(`/api/agent?userId=${userId}&agentId=${agent.id}`, {
        method: 'DELETE',
      });
      onRemove(agent.id);
    } catch (error) {
      console.error('Error removing agent:', error);
      alert('Failed to remove agent. Please try again.');
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
          color="error"
          fullWidth 
          onClick={handleRemove}
        >
          Remove
        </Button>
      </Box>
    </Card>
  );
} 