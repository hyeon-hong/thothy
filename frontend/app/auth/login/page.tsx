"use client";

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Header currentView="login" />
      
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Thothy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please sign in to continue
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <button
            onClick={signIn}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <img src="/google.svg" alt="Google" className="w-6 h-6" />
            <span>Sign in with Google</span>
          </button>
        </Box>
      </Container>
    </div>
  );
} 