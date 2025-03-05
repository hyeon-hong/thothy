import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Get the redirect destination, defaulting to homepage if not specified
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/';
  
  console.log('Sign-in request with redirect to:', redirectTo);

  const supabase = createClient(
    process.env.SUPABASE_API_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Construct the callback URL with the redirect destination
  const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`);
  callbackUrl.searchParams.set('redirect_to', redirectTo);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });
  
  console.log('Google sign in data:', data);

  if (error) {
    console.error('Error signing in with Google:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Redirecting to Google OAuth:', data.url);
  return NextResponse.redirect(data.url);
} 