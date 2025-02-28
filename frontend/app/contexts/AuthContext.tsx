"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  supabase: typeof supabase;
  refreshSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  supabase: supabase,
  refreshSession: async () => null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to handle retries for auth operations
  const withRetry = async <T,>(operation: () => Promise<T>, retryCount = 0): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      if ((error?.status === 401 || error?.status === 403) && retryCount < MAX_RETRIES) {
        console.log(`Auth error, attempting to refresh session... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        const newSession = await refreshSession();
        if (newSession) {
          return withRetry(operation, retryCount + 1);
        }
      }
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        return currentSession;
      }
      
      // If no session, try to refresh
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        return refreshedSession;
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initialize session from localStorage if available
    const initializeSession = async () => {
      try {
        await withRetry(async () => {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        });
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    return withRetry(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    });
  };

  const signOut = async () => {
    return withRetry(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signInWithGoogle, 
      signOut, 
      supabase,
      refreshSession 
    }}>
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