import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Initial session:', session);
                if (session?.user) {
                    await updateUser(session.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error getting session:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('Auth state changed:', _event, session);
            if (session?.user) {
                await updateUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => subscription?.unsubscribe();
    }, []);

    const updateUser = async (supabaseUser) => {
        if (!supabaseUser) {
            setUser(null);
            return;
        }

        try {
            // First, try to get user data from the users table
            let { data: dbUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (error || !dbUser) {
                // If user doesn't exist in the users table, create them
                const userData = {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    name: supabaseUser.user_metadata?.name || supabaseUser.email,
                    picture: supabaseUser.user_metadata?.avatar_url
                };

                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .upsert(userData)
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating user:', insertError);
                    return;
                }

                dbUser = newUser;
            }

            const userWithMetadata = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: dbUser.name || supabaseUser.user_metadata?.name || supabaseUser.email,
                picture: dbUser.picture || supabaseUser.user_metadata?.avatar_url,
            };

            console.log('Setting user:', userWithMetadata);
            setUser(userWithMetadata);
        } catch (error) {
            console.error('Error updating user:', error);
            // If there's an error, still set basic user info from auth
            setUser({
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name || supabaseUser.email,
                picture: supabaseUser.user_metadata?.avatar_url
            });
        }
    };

    return (
        <UserContext.Provider value={{ 
            user, 
            setUser: updateUser, 
            isLoading,
            supabase // Expose supabase client for auth operations
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
} 