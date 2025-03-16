"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Container, Typography, Box } from '@mui/material';
import Header from '../components/Header';

export default function InboxPage() {
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
        <Header currentView="inbox" />
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
      <Header currentView="inbox" />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Inbox
          </Typography>
          <Typography variant="body1">
            Welcome to your inbox. Here you'll find your messages and notifications.
          </Typography>
        </Box>
      </Container>
    </>
  );
} 