"use client";

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-background">
      <Header currentView="login" />
      
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Authentication Error
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {error || 'An error occurred during authentication.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please try signing in again.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="gap-2"
          >
            Return to Login
          </Button>
        </Box>
      </Container>
    </div>
  );
} 