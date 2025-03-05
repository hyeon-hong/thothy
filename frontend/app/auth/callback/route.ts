import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_API_URL) {
    throw new Error('Missing environment variable: SUPABASE_API_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/';

        if (code) {
            // Create a Supabase client without session handling
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

            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
                console.error('Error exchanging code for session:', error);
                return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
            }

            // Create a response with the redirected URL
            const response = NextResponse.redirect(new URL(next, request.url));

            // Set auth cookies
            response.cookies.set('sb-access-token', data.session.access_token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            response.cookies.set('sb-refresh-token', data.session.refresh_token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            return response;
        }

        // Return the user to an error page with instructions
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    } catch (error) {
        console.error("Error handling OAuth callback:", error);
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }
} 