"use client";

import React from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Button, 
  Grid 
} from '@mui/material';
import Header from '@/components/Header';
import { Add as AddIcon } from '@mui/icons-material';

export default function ProjectPage() {
  return (
    <>
      <Header currentView="project" />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Projects
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
            >
              New Project
            </Button>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Create and manage your projects. Track progress, collaborate with your team, and organize your work.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 2,
                  textAlign: 'center',
                  py: 8
                }}
              >
                <Typography variant="h6" gutterBottom>
                  No projects yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Get started by creating your first project
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<AddIcon />}
                >
                  Create Project
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
} 