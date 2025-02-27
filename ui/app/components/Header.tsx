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
} from '@mui/material';
import { useUser } from '../contexts/UserContext';
import Link from 'next/link';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { user, signInWithGoogle, signOut } = useUser();
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

          <Box sx={{ display: 'flex', gap: 2 }}>
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
                sx={{ ml: 2 }}
              >
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