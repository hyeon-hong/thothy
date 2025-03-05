"use client";

import React from "react";
import { Button, Typography, Container, Box, Paper } from "@mui/material";
import Link from "next/link";

type AuthCodeErrorPageProps = {
  searchParams: {
    error?: string;
    errorDescription?: string;
    reason?: string;
    code?: string;
    details?: string;
    url?: string;
  };
};

export default function AuthCodeErrorPage({
  searchParams,
}: AuthCodeErrorPageProps) {
  const { error, errorDescription, reason, code, details, url } = searchParams;

  // Define error messages based on error codes
  const errorMessages: Record<string, { title: string; message: string; solution: string }> = {
    // OAuth provider errors
    "access_denied": {
      title: "Access Denied",
      message: "You denied access to your Google account.",
      solution: "Try signing in again and approve the permissions request."
    },
    "invalid_request": {
      title: "Invalid Request",
      message: "The OAuth request was malformed or missing parameters.",
      solution: "Try again or contact support if the issue persists."
    },
    "unauthorized_client": {
      title: "Unauthorized Client",
      message: "The application is not authorized to use Google Sign-In.",
      solution: "This is a configuration issue. Please contact support."
    },
    
    // Supabase specific errors
    "exchange_failed": {
      title: "Session Exchange Failed",
      message: "We couldn't exchange the authorization code for a session.",
      solution: "This may be a temporary issue. Try signing in again."
    },
    
    // Custom error reasons
    "no_code": {
      title: "Authorization Code Missing",
      message: "No authorization code was returned from Google.",
      solution: "This could be due to a canceled sign-in or a configuration issue. Try again or contact support."
    },
    "no_oauth_flow": {
      title: "OAuth Flow Not Initiated",
      message: "The callback was accessed directly without starting the OAuth flow.",
      solution: "Please start the sign-in process from the sign-in page."
    },
    "direct_callback_access": {
      title: "OAuth Redirect Issue",
      message: "The callback URL was accessed directly without completing the OAuth flow.",
      solution: "This indicates a potential issue with the Google OAuth configuration in Supabase. Try clearing your cookies and signing in again."
    },
    "state_mismatch": {
      title: "Security Verification Failed",
      message: "The state parameter did not match the expected value.",
      solution: "This could indicate a potential security issue. Try clearing your cookies and signing in again from a fresh browser window."
    },
    "no_state_parameter": {
      title: "Missing Security Token",
      message: "The state parameter was missing from the OAuth response.",
      solution: "This could indicate an interrupted authentication flow. Try signing in again."
    },
    "exchange_error": {
      title: "Session Creation Error",
      message: "An error occurred when trying to create your session.",
      solution: "This might be a temporary issue. Try again or contact support if the problem persists."
    }
  };

  // Get error information or use default
  const errorInfo = 
    errorMessages[reason || error || "unknown"] || 
    {
      title: "Authentication Error",
      message: errorDescription || details || "An unknown error occurred during authentication.",
      solution: "Please try signing in again. If the problem persists, contact support."
    };

  console.error("Auth Code Error Page Loaded", {
    error,
    errorDescription,
    reason,
    code,
    details,
    url
  });

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" component="h1" color="error" gutterBottom>
            {errorInfo.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {errorInfo.message}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Troubleshooting:
          </Typography>
          <Typography variant="body2">
            {errorInfo.solution}
          </Typography>
          
          {(error || details || url) && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#263238", color: "#fff", borderRadius: 1, overflow: "auto", maxHeight: "200px" }}>
              <Typography variant="body2" component="div" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                {error && <Box><strong>Error:</strong> {error}</Box>}
                {reason && <Box><strong>Reason:</strong> {reason}</Box>}
                {details && <Box><strong>Details:</strong> {details}</Box>}
                {url && (
                  <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    <strong>URL:</strong> {url}
                  </Box>
                )}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            href="/signin"
            fullWidth
          >
            Try again
          </Button>
          <Button 
            variant="outlined" 
            component={Link} 
            href="/"
            fullWidth
          >
            Return to homepage
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 