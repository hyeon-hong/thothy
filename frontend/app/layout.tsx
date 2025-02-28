"use client";

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { UserProvider } from "./contexts/UserContext";

const theme = createTheme({
    palette: {
        mode: "light",
        background: {
            default: "#ffffff",
        },
        primary: {
            main: "#000000",
        },
    },
    typography: {
        fontFamily: "'Roboto', 'Arial', sans-serif",
        h1: {
            fontSize: "4rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
        },
        h3: {
            fontSize: "2.5rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
        },
        h5: {
            fontFamily: "'Roboto Mono', monospace",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 28,
                    padding: "10px 24px",
                    textTransform: "none",
                    fontSize: "1rem",
                },
            },
        },
    },
});

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <UserProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        {children}
                    </ThemeProvider>
                </UserProvider>
            </body>
        </html>
    );
}
