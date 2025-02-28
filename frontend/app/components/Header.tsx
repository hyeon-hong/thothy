"use client";

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontFamily: "'Roboto Mono', monospace",
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Thothy
            </Typography>
          </Link>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              color={currentView === 'home' ? 'primary' : 'inherit'}
              onClick={() => onViewChange('home')}
              sx={{
                fontWeight: currentView === 'home' ? 700 : 400,
              }}
            >
              Explore
            </Button>

            {user && (
              <Button
                color={currentView === 'myAgents' ? 'primary' : 'inherit'}
                onClick={() => onViewChange('myAgents')}
                sx={{
                  fontWeight: currentView === 'myAgents' ? 700 : 400,
                }}
              >
                My Agents
              </Button>
            )}

            {user ? (
              <Button
                variant="outlined"
                color="primary"
                onClick={signOut}
                sx={{ 
                  ml: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                }}
              >
                <Avatar
                  src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                  alt={user.user_metadata?.full_name || user.email}
                  sx={{ width: 24, height: 24 }}
                />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={signInWithGoogle}
                sx={{ ml: 2 }}
              >
                Sign in with Google
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
} 