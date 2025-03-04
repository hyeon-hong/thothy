"use client";

import React, { useState } from "react";
import { Container, Typography, Button, Box, Grid, Paper } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import AgentHub from "./components/AgentHub";
import MyAgents from "./components/MyAgents";

export default function Home() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState("landing"); // "landing", "home", or "myAgents"

    const handleGetStarted = () => {
        if (user) {
            setCurrentView("home");
        } else {
            router.push("/auth/signin");
        }
    };

    if (currentView === "landing") {
        return (
            <Box>
                <Header onViewChange={setCurrentView} currentView={currentView} />
                {/* Hero Section */}
                <Box
                    sx={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        py: 12,
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <Container maxWidth="lg">
                        <Grid container spacing={4} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography
                                    variant="h2"
                                    component="h1"
                                    gutterBottom
                                    sx={{
                                        fontWeight: 700,
                                        mb: 3,
                                        fontSize: { xs: "2.5rem", md: "3.5rem" },
                                    }}
                                >
                                    Your Personal AI Assistant
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        mb: 4,
                                        opacity: 0.9,
                                    }}
                                >
                                    Meet Thothy - your friendly AI companion that helps you get things done faster and smarter. No complex tech talk, just simple solutions for your daily tasks.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleGetStarted}
                                    sx={{
                                        bgcolor: "white",
                                        color: "#764ba2",
                                        "&:hover": {
                                            bgcolor: "#f8f9fa",
                                        },
                                        px: 4,
                                        py: 1.5,
                                        fontSize: "1.1rem",
                                    }}
                                >
                                    Get Started
                                </Button>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box
                                    component="img"
                                    src="/hero-image.png"
                                    alt="Thothy AI Assistant"
                                    sx={{
                                        width: "100%",
                                        maxWidth: 500,
                                        display: { xs: "none", md: "block" },
                                        mx: "auto",
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* Features Section */}
                <Container maxWidth="lg" sx={{ py: 8 }}>
                    <Typography
                        variant="h3"
                        component="h2"
                        align="center"
                        gutterBottom
                        sx={{ mb: 6, fontWeight: 700 }}
                    >
                        Why Choose Thothy?
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: "100%",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    Smart & Simple
                                </Typography>
                                <Typography color="text.secondary">
                                    No tech jargon here! Thothy speaks your language and helps you accomplish tasks without the complexity.
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: "100%",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    Always Learning
                                </Typography>
                                <Typography color="text.secondary">
                                    The more you use Thothy, the better it gets at understanding your needs and preferences.
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: "100%",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                    Your Time Saver
                                </Typography>
                                <Typography color="text.secondary">
                                    Let Thothy handle the routine tasks while you focus on what matters most to you.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>

                {/* CTA Section */}
                <Box sx={{ bgcolor: "#f8f9fa", py: 8 }}>
                    <Container maxWidth="md">
                        <Box textAlign="center">
                            <Typography
                                variant="h3"
                                component="h2"
                                gutterBottom
                                sx={{ fontWeight: 700, mb: 3 }}
                            >
                                Ready to Get Started?
                            </Typography>
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ mb: 4 }}
                            >
                                Join thousands of users who are already experiencing the power of Thothy.
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleGetStarted}
                                sx={{
                                    bgcolor: "#764ba2",
                                    "&:hover": {
                                        bgcolor: "#667eea",
                                    },
                                    px: 6,
                                    py: 1.5,
                                    fontSize: "1.1rem",
                                }}
                            >
                                Try Thothy Now
                            </Button>
                        </Box>
                    </Container>
                </Box>
            </Box>
        );
    }

    return (
        <>
            <Header onViewChange={setCurrentView} currentView={currentView} />
            {currentView === "home" ? <AgentHub /> : <MyAgents />}
        </>
    );
}
