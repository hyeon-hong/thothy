"use client";

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./contexts/AuthContext";
import AuthButtons from "./components/AuthButtons";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
                            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                                <h1 className="text-xl font-bold">Thothy</h1>
                                <AuthButtons />
                            </div>
                        </header>
                        <main className="pt-16">
                            {children}
                        </main>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
