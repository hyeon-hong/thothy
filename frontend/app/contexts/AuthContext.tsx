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
                const response = await fetch("/api/auth/session");
                console.log("Session response:", response);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Session data:", data);

                    if (data.session?.user) {
                        // Extract user metadata from Google OAuth
                        const userMetadata = data.session.user.user_metadata;
                        console.log("User metadata:", userMetadata);

                        // Update user with Google profile information
                        const updatedUser = {
                            ...data.session.user,
                            user_metadata: {
                                ...userMetadata,
                                full_name:
                                    userMetadata?.full_name ||
                                    userMetadata?.name ||
                                    data.session.user.email,
                                avatar_url:
                                    userMetadata?.avatar_url ||
                                    userMetadata?.picture,
                            },
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
                console.error("Error checking session:", error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const signIn = useCallback(async () => {
        console.log("Signing in with Google");

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
            console.error("Error signing in:", error);
            throw error;
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
            const response = await fetch("/api/auth/signout", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Sign out failed");
            }

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
