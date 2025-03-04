"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { api } from "@/lib/api";

const MAX_RETRIES = 3;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        const checkSession = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    setSession(data.session);
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Sign in failed');
            }

            const data = await response.json();
            setSession(data.session);
            setUser(data.user);
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Sign up failed');
            }

            const data = await response.json();
            setSession(data.session);
            setUser(data.user);
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    redirectTo: `${window.location.origin}/api/auth/callback`,
                }),
            });
            console.log('Google sign in response:', response);

            if (!response.ok) {
                throw new Error('Google sign in failed');
            }

            const data = await response.json();
            // Redirect to the Google OAuth URL
            window.location.href = data.url;
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/signout', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Sign out failed');
            }

            setSession(null);
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, signIn, signUp, signInWithGoogle, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 