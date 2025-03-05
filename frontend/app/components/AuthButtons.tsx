'use client';

import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}

interface Session {
  user: User;
}

export default function AuthButtons() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setSession(data.session);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const handleSignIn = () => {
    window.location.href = '/api/auth/signIn';
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signOut', { method: 'POST' });
      setSession(null);
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    const name = 
      session.user.user_metadata.full_name || 
      session.user.user_metadata.name || 
      session.user.email;
      
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {name}
        </span>
        <Button variant="outlined" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleSignIn} variant="contained">
      Sign in with Google
    </Button>
  );
} 