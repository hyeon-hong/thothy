"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
const STORAGE_KEY = "thothy_auth_state";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    signIn: () => Promise<void>;
    signUp: () => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to save auth state to localStorage
const saveAuthState = (user: User | null, session: Session | null) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, session }));
    }
};

// Helper function to load auth state from localStorage
const loadAuthState = () => {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error("Error parsing stored auth state:", error);
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
    const supabase = createClient();

    useEffect(() => {
        // Initialize session from localStorage to prevent flash of unauthenticated state
        const storedState = loadAuthState();
        if (storedState) {
            setUser(storedState.user);
            setSession(storedState.session);
        }

        // Check for active session and get user
        const initializeAuth = async () => {
            try {
                // This will use the existing session and refresh the token if needed
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                
                if (error) throw error;
                
                if (currentSession?.user) {
                    // Extract user metadata from Google OAuth
                    const userMetadata = currentSession.user.user_metadata || {};

                    // Update user with Google profile information
                    const updatedUser = {
                        ...currentSession.user,
                        user_metadata: {
                            ...userMetadata,
                            full_name:
                                userMetadata?.full_name ||
                                userMetadata?.name ||
                                currentSession.user.email,
                            avatar_url:
                                userMetadata?.avatar_url ||
                                userMetadata?.picture,
                        },
                    };

                    setSession(currentSession);
                    setUser(updatedUser);
                    saveAuthState(updatedUser, currentSession);
                } else {
                    setSession(null);
                    setUser(null);
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (error) {
                console.error("Error initializing auth:", error);
                setSession(null);
                setUser(null);
                localStorage.removeItem(STORAGE_KEY);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Set up auth state change listener (this handles token refreshes)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log("Auth state changed:", event);
                console.log("Current session:", currentSession);
                
                if (currentSession?.user) {
                    // Extract user metadata from Google OAuth
                    const userMetadata = currentSession.user.user_metadata || {};

                    // Update user with Google profile information
                    const updatedUser = {
                        ...currentSession.user,
                        user_metadata: {
                            ...userMetadata,
                            full_name:
                                userMetadata?.full_name ||
                                userMetadata?.name ||
                                currentSession.user.email,
                            avatar_url:
                                userMetadata?.avatar_url ||
                                userMetadata?.picture,
                        },
                    };

                    setSession(currentSession);
                    setUser(updatedUser);
                    saveAuthState(updatedUser, currentSession);
                } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
                    setSession(null);
                    setUser(null);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        );

        // Clean up subscription when component unmounts
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async () => {
        try {
            // Redirect to the sign-in API endpoint
            window.location.href = '/api/auth/signin?provider=google';
        } catch (error) {
            console.error("Error signing in:", error);
        }
    }, []);

    const signUp = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error("Sign up failed");
            }

            const data = await response.json();
            setSession(data.session);
            setUser(data.user);
            saveAuthState(data.user, data.session);
        } catch (error) {
            console.error("Error signing up:", error);
            throw error;
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            // Use Supabase's signOut method which properly handles tokens
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            // Also call the API to clear server-side cookies
            await fetch("/api/auth/signout", {
                method: "POST",
            });

            setSession(null);
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                signIn,
                signUp,
                signOut,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
