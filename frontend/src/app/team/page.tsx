"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Container, Typography, Box } from '@mui/material';
import Header from '@/components/Header';

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <>
        <Header currentView="team" />
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header currentView="team" />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Team
          </Typography>
          <Typography variant="body1">
            Welcome to the team page. Here you can manage your team and collaborate with others.
          </Typography>
        </Box>
      </Container>
    </>
  );
} 