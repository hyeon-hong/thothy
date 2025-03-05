"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { api } from "@/lib/api";

const MAX_RETRIES = 3;
const STORAGE_KEY = 'thothy_auth_state';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: (redirectTo?: string) => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to save auth state to localStorage
const saveAuthState = (user: User | null, session: Session | null) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, session }));
    }
};

// Helper function to load auth state from localStorage
const loadAuthState = () => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Error parsing stored auth state:', error);
                return null;
            }
        }
    }
    return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load initial state from localStorage
        const storedState = loadAuthState();
        if (storedState) {
            setUser(storedState.user);
            setSession(storedState.session);
        }

        // Check active sessions and sets the user
        const checkSession = async () => {
            try {
                const response = await fetch('/api/auth/session');
                console.log('Session response:', response);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Session data:', data);
                    
                    if (data.session?.user) {
                        // Extract user metadata from Google OAuth
                        const userMetadata = data.session.user.user_metadata;
                        console.log('User metadata:', userMetadata);
                        
                        // Update user with Google profile information
                        const updatedUser = {
                            ...data.session.user,
                            user_metadata: {
                                ...userMetadata,
                                full_name: userMetadata?.full_name || userMetadata?.name || data.session.user.email,
                                avatar_url: userMetadata?.avatar_url || userMetadata?.picture,
                            }
                        };
                        
                        setSession(data.session);
                        setUser(updatedUser);
                        saveAuthState(updatedUser, data.session);
                    } else {
                        setSession(null);
                        setUser(null);
                        localStorage.removeItem(STORAGE_KEY);
                    }
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
            saveAuthState(data.user, data.session);
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
            saveAuthState(data.user, data.session);
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }, []);

    const signInWithGoogle = useCallback(async (redirectTo?: string) => {
        console.log('Signing in with Google, redirect to:', redirectTo);
        try {
            // Construct the URL with the redirect parameter if provided
            let url = '/api/auth/signin';
            if (redirectTo) {
                url += `?redirect_to=${encodeURIComponent(redirectTo)}`;
            }
            
            // Redirect user to the signIn API route, which initiates the Google OAuth flow
            window.location.href = url;
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
            localStorage.removeItem(STORAGE_KEY);
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