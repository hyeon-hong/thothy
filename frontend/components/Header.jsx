import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useUser } from '../contexts/UserContext';
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
    const { user, supabase } = useUser();
    const [anchorEl, setAnchorEl] = useState(null);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const router = useRouter();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
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

    const handleLoginClick = () => {
        setAuthDialogOpen(true);
    };

    return (
        <>
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
                                <LoginButton onClick={handleLoginClick}>
                                    Sign in
                                </LoginButton>
                            </Box>
                        ) : (
                            <>
                                <UserButton onClick={handleClick}>
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

            <Dialog 
                open={authDialogOpen} 
                onClose={() => setAuthDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Sign in to Agent Hub</DialogTitle>
                <DialogContent>
                    <Auth
                        supabaseClient={supabase}
                        appearance={{ theme: ThemeSupa }}
                        providers={['google']}
                        redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
