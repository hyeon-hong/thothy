"use client";

import { useRouter } from "next/navigation";
import { Button, Container, Typography, Box } from "@mui/material";

export default function AuthError() {
    const router = useRouter();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Typography component="h1" variant="h4" gutterBottom>
                    Authentication Error
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" paragraph>
                    There was an error during the authentication process. Please try again.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push("/")}
                    sx={{ mt: 2 }}
                >
                    Return to Home
                </Button>
            </Box>
        </Container>
    );
} 