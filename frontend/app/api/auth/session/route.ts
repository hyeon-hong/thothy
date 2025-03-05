import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // Get cookies from the request - cookies() must be awaited
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;
  
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ session: null });
  }
  
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
  
  // Try to get the user with the access token
  const { data, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !data?.user) {
    return NextResponse.json({ session: null });
  }
  
  // Create a session object
  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: data.user
  };
  
  return NextResponse.json({ session });
} 