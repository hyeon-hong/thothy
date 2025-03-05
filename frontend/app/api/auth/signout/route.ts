import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  // Create a response that we'll use to clear the cookies
  const response = NextResponse.json({ message: 'Signed out successfully' });

  // Clear the Supabase cookies
  response.cookies.set('sb-access-token', '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('sb-refresh-token', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
} 