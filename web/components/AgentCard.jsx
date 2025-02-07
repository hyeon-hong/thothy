import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';

export default function AgentCard({ agent, onSelect }) {
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
          fullWidth 
          onClick={() => onSelect(agent.id)}
        >
          Select
        </Button>
      </Box>
    </Card>
  );
} 