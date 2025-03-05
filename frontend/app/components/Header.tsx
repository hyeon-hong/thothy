"use client";

import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  IconButton,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/Logout';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { user, signIn, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get user's display name and avatar
  const displayName = user?.user_metadata?.full_name || user?.email;
  const avatarUrl = user?.user_metadata?.avatar_url;

  const navButtonStyle = {
    textTransform: 'none',
    fontSize: '1rem',
    minWidth: 'auto',
    px: 2,
  };

  const handleTothyClick = () => {
    onViewChange('landing');
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleMenuClose();
    signOut();
  };

  // Get current path for redirect after login
  const handleSignIn = () => {
    signIn();
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '2px solid rgba(0, 0, 0, 0.12)' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
          <Typography
            variant="h5"
            component="div"
            onClick={handleTothyClick}
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              fontWeight: 700,
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            Thothy
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              color={currentView === 'home' ? 'primary' : 'inherit'}
              onClick={() => onViewChange('home')}
              sx={{
                ...navButtonStyle,
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
                  ...navButtonStyle,
                  fontWeight: currentView === 'myAgents' ? 700 : 400,
                }}
              >
                My Agents
              </Button>
            )}

            {user ? (
              <>
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <Avatar
                    src={avatarUrl}
                    alt={displayName}
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: theme.palette.primary.main,
                    }}
                  >
                    {!avatarUrl && displayName?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleSignOut}>
                    <Logout sx={{ mr: 1 }} />
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSignIn}
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