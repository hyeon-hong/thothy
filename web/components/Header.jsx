import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    Menu,
    MenuItem,
} from "@mui/material";
import { useState } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { createOrUpdateUser } from '../lib/db';

export default function Header({ onViewChange, currentView }) {
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

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
        onViewChange("home"); // Switch to home view after logout
    };

    const handleMyAgents = () => {
        handleClose();
        onViewChange("myAgents");
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ flexGrow: 1, cursor: "pointer" }}
                    onClick={() => onViewChange("home")}
                >
                    Agent Hub
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {!user ? (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => login()}
                            >
                                Sign in with Google
                            </Button>
                        </Box>
                    ) : (
                        <>
                            <Button
                                color="inherit"
                                onClick={handleClick}
                                sx={{ textTransform: "none" }}
                            >
                                {user.name}
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
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
            </Toolbar>
        </AppBar>
    );
}
