import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    Menu,
    MenuItem,
} from "@mui/material";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useUser } from '../contexts/UserContext';
import { createOrUpdateUser } from '../lib/db';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

const StyledToolbar = styled(Toolbar)({
    padding: '1rem 2rem',
});

const UserButton = styled(Button)({
    backgroundColor: '#f5f5f5',
    color: '#000',
    '&:hover': {
        backgroundColor: '#e0e0e0',
    },
    borderRadius: 28,
    padding: '8px 20px',
    textTransform: 'none',
    boxShadow: 'none',
});

const LoginButton = styled(Button)({
    backgroundColor: '#000',
    color: '#fff',
    '&:hover': {
        backgroundColor: '#333',
    },
    borderRadius: 28,
    padding: '8px 24px',
    textTransform: 'none',
});

export default function Header({ onViewChange, currentView }) {
    const { user, setUser, isLoading } = useUser();
    const [anchorEl, setAnchorEl] = useState(null);
    const router = useRouter();

    const login = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                const userInfo = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${response.access_token}`,
                        },
                    }
                ).then((res) => res.json());

                const dbUser = await fetch('/api/user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture,
                    }),
                }).then(res => res.json());

                setUser({
                    id: dbUser.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                });
            } catch (error) {
                console.log("Error fetching user info:", error);
            }
        },
        onError: () => {
            console.log("Login Failed");
        },
    });

    if (isLoading) {
        return null; // or a loading spinner
    }

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        googleLogout();
        setUser(null);
        handleClose();
        if (currentView === 'run') {
            router.push('/');
        } else {
            onViewChange("home");
        }
    };

    const handleMyAgents = () => {
        handleClose();
        if (currentView === 'run') {
            router.push('/?view=myAgents');
        } else {
            onViewChange("myAgents");
        }
    };

    const handleHomeClick = () => {
        if (currentView === 'run') {
            router.push('/');
        } else {
            onViewChange("home");
        }
    };

    return (
        <AppBar position="static" elevation={0} sx={{ backgroundColor: '#fff', borderBottom: '1px solid #eaeaea' }}>
            <StyledToolbar>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ 
                        flexGrow: 1, 
                        cursor: "pointer",
                        color: '#000',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                    }}
                    onClick={handleHomeClick}
                >
                    Agent Hub
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {!user ? (
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                            <LoginButton
                                onClick={() => login()}
                            >
                                Sign in with Google
                            </LoginButton>
                        </Box>
                    ) : (
                        <>
                            <UserButton
                                onClick={handleClick}
                            >
                                {user.name}
                            </UserButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                PaperProps={{
                                    sx: {
                                        mt: 1,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    }
                                }}
                            >
                                <MenuItem disabled>{user.email}</MenuItem>
                                <MenuItem onClick={handleMyAgents}>
                                    My Agents
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    Logout
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>
            </StyledToolbar>
        </AppBar>
    );
}
