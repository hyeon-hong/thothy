import React, { useState } from 'react';
import { Card, Typography, Box, Button, CardContent, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

export default function AgentCardWithRemove({ agent, onRemove }) {
    const router = useRouter();
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = async (e) => {
        e.stopPropagation(); // Prevent card click when clicking the delete button
        if (window.confirm(`Are you sure you want to remove "${agent.name}" from your agents?`)) {
            setIsRemoving(true);
            try {
                await onRemove(agent.id);
            } catch (error) {
                console.error('Error removing agent:', error);
                alert('Failed to remove agent');
            } finally {
                setIsRemoving(false);
            }
        }
    };

    const handleCardClick = () => {
        if (agent.graph_name) {
            router.push(`/agents/${agent.graph_name}`);
        } else {
            alert("This agent doesn't have a valid configuration");
        }
    };

    return (
        <Card 
            sx={{ 
                cursor: 'pointer', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                }
            }}
            onClick={handleCardClick}
        >
            <CardContent sx={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <IconButton 
                        aria-label="delete" 
                        size="small" 
                        onClick={handleRemove}
                        disabled={isRemoving}
                        sx={{ color: 'grey.500', '&:hover': { color: 'error.main' } }}
                    >
                        {isRemoving ? <CircularProgress size={20} /> : <DeleteIcon />}
                    </IconButton>
                </Box>
                
                <Typography variant="h6" gutterBottom component="div">
                    {agent.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                    {agent.description || "No description available"}
                </Typography>
                
                <Box sx={{ mt: 'auto' }}>
                    <Button 
                        variant="contained" 
                        fullWidth
                        disabled={isRemoving}
                    >
                        Launch
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
} 