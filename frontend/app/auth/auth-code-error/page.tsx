"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button, Container, Typography, Box, Paper, Alert, Link } from "@mui/material";
import { useEffect, useState } from "react";

export default function AuthError() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [errorReason, setErrorReason] = useState<string>("");
    const [errorDetails, setErrorDetails] = useState<string>("");
    const [troubleshootingSteps, setTroubleshootingSteps] = useState<string[]>([]);
    
    useEffect(() => {
        const reason = searchParams.get("reason");
        const error = searchParams.get("error");
        
        let details = "";
        let steps: string[] = [];
        
        if (error) {
            details = `Error from provider: ${error}`;
            setErrorDetails(details);
        }
        
        if (reason === "no_code") {
            setErrorReason("No authentication code was received from the provider.");
            steps = [
                "Clear your browser cookies and cache",
                "Try a different browser",
                "Check if pop-ups are blocked by your browser",
                "Ensure you have properly configured Google OAuth in Supabase"
            ];
        } else if (reason === "no_oauth_flow") {
            setErrorReason("The authentication flow was not properly initiated.");
            steps = [
                "Return to the homepage and try again",
                "Ensure JavaScript is enabled in your browser",
                "Check your internet connection"
            ];
        } else if (reason === "exchange_error") {
            setErrorReason("There was an error exchanging the authentication code for a session.");
            steps = [
                "The OAuth code may have expired. Try again from the beginning",
                "Check your Supabase service role key and API URL settings",
                "Ensure the callback URL is registered in your Supabase project"
            ];
        } else {
            setErrorReason("There was an error during the authentication process.");
            steps = [
                "Try signing in again",
                "Clear your browser cookies and cache",
                "Try a different browser"
            ];
        }
        
        setTroubleshootingSteps(steps);
    }, [searchParams]);

    // Try login again function
    const tryAgain = () => {
        router.push("/");
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 8,
                    mb: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        maxWidth: 500,
                        width: '100%'
                    }}
                >
                    <Typography component="h1" variant="h4" gutterBottom>
                        Authentication Error
                    </Typography>
                    
                    <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                        {errorReason}
                    </Alert>
                    
                    {errorDetails && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, width: '100%', fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                            {errorDetails}
                        </Typography>
                    )}
                    
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, alignSelf: 'flex-start' }}>
                        Troubleshooting Steps:
                    </Typography>
                    
                    <Box sx={{ width: '100%', mb: 3 }}>
                        <ul>
                            {troubleshootingSteps.map((step, index) => (
                                <li key={index}>
                                    <Typography variant="body1">
                                        {step}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={tryAgain}
                            fullWidth
                        >
                            Try Again
                        </Button>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                        Need help? Contact <Link href="mailto:support@example.com">support@example.com</Link>
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
} 