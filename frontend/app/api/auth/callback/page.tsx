'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_API_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the hash fragment from the URL
                const hash = window.location.hash.substring(1);
                console.log('Hash fragment:', hash);
                
                const hashParams = new URLSearchParams(hash);
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                console.log('Access token present:', !!accessToken);
                console.log('Refresh token present:', !!refreshToken);

                if (accessToken && refreshToken) {
                    // Set the session directly using the tokens
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    console.log('Set session result:', { success: !error, error });

                    if (error) {
                        console.error('Error setting session:', error);
                        router.replace('/auth/auth-code-error');
                    } else {
                        console.log('Session set successfully:', data);
                        router.replace('/');
                    }
                } else {
                    console.error('No tokens found in hash');
                    router.replace('/auth/auth-code-error');
                }
            } catch (error) {
                console.error('Error during auth callback:', error);
                router.replace('/auth/auth-code-error');
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h5" gutterBottom>
                    Completing sign in...
                </Typography>
                <CircularProgress />
            </Box>
        </Container>
    );
} 